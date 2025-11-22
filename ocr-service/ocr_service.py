import os
import requests
import json
from typing import Dict, Any, Optional, Tuple
import cv2
import base64
from PIL import Image
import io
import re
import numpy as np
import hashlib
from pdf2image import convert_from_path
import logging
import time
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import imagehash
import gc

# Set up logging
logger = logging.getLogger(__name__)

class OCRService:
    # Mapping of class IDs to field names
    CLASS_MAPPING = {
        0: "name",
        1: "aadhaar_number",
        2: "dob",
        3: "gender",
        4: "address"
    }

    def __init__(self):
        self.api_key = os.environ.get("OCR_API_KEY")
        self.api_url = "https://api.ocr.space/parse/image"
        self.debug = True
        
        # Validate API key
        if not self.api_key:
            logger.error("OCR_API_KEY environment variable not set. OCR.space API key is required.")
            raise ValueError("OCR_API_KEY environment variable is required for OCR processing.")
        else:
            logger.info(f"OCR Service initialized with API key: {self.api_key[:8]}...")
        
        # Create a session with retry strategy
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def _generate_hash(self, text: str) -> str:
        """
        Generate SHA-256 hash of the extracted text.
        
        Args:
            text (str): The text to hash
            
        Returns:
            str: SHA-256 hash in hexadecimal format
        """
        # Create a SHA-256 hash object
        hash_object = hashlib.sha256()
        
        # Update the hash object with the text (encode to bytes first)
        hash_object.update(text.encode('utf-8'))
        
        # Get the hexadecimal digest
        return hash_object.hexdigest()

    def _convert_to_bytes32(self, hex_hash: str) -> bytes:
        """
        Convert a hex hash string to bytes32 format for smart contract.
        
        Args:
            hex_hash (str): Hex string hash
            
        Returns:
            bytes: bytes32 format hash
        """
        # Remove '0x' prefix if present
        if hex_hash.startswith('0x'):
            hex_hash = hex_hash[2:]
            
        # Ensure the hash is 64 characters (32 bytes)
        if len(hex_hash) != 64:
            raise ValueError("Hash must be 32 bytes (64 hex characters)")
            
        # Convert to bytes
        return bytes.fromhex(hex_hash)

    def _extract_fields(self, text: str) -> Tuple[str, str, str]:
        """
        Extract name, contact number, and residence from OCR text.
        
        Args:
            text (str): Raw OCR text
            
        Returns:
            Tuple[str, str, str]: (name, contact_number, residence)
        """
        # Initialize fields
        name = ""
        contact_number = ""
        residence = ""
        
        # Split text into lines
        lines = text.split('\n')
        
        # Extract name (usually after "GOVERNMENT OF INDIA")
        for i, line in enumerate(lines):
            if "GOVERNMENT OF INDIA" in line and i + 1 < len(lines):
                name = lines[i + 1].strip()
                break
        
        # Extract contact number (look for "Mobile No:" or similar)
        for line in lines:
            if "Mobile No:" in line:
                contact_number = re.search(r'\d{10}', line)
                if contact_number:
                    contact_number = contact_number.group()
                break
        
        # Extract residence (usually contains address)
        for line in lines:
            if any(keyword in line.lower() for keyword in ['address', 'residence', 'location']):
                residence = line.strip()
                break
        
        return name, contact_number, residence

    def prepare_for_smart_contract(self, ocr_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare OCR result for smart contract integration.
        Now only extracts all text and hashes it, does not parse specific fields.
        """
        if not ocr_result.get('debug_info', {}).get('raw_text'):
            raise ValueError("No text content found in OCR result")
        raw_text = ocr_result['debug_info']['raw_text']
        # Generate hash and convert to bytes32
        hex_hash = self._generate_hash(raw_text)
        bytes32_hash = self._convert_to_bytes32(hex_hash)
        return {
            'documentHash': '0x' + bytes32_hash.hex(),
            'name': '',
            'contactNumber': '',
            'residence': '',
            'rawText': raw_text,
            'hexHash': hex_hash,
            'phash': ocr_result.get('phash', None)
        }

    def extract_aadhaar_number(self, image_path: str) -> Dict[str, Any]:
        """
        Extract Aadhaar number from an Aadhaar card image using OCR.space API.
        
        Args:
            image_path (str): Path to the image file
            
        Returns:
            Dict[str, Any]: Extracted Aadhaar number and metadata
        """
        try:
            logger.info(f"Starting OCR processing for file: {image_path}")
            
            # Read and preprocess the image (support PDF and images)
            # Memory optimization: Use lower DPI and limit image size early
            image = None
            pil_image = None
            max_image_dimension = 2000  # Limit max dimension to reduce memory
            
            if image_path.lower().endswith('.pdf'):
                logger.info("Processing PDF file")
                # Convert first page of PDF to image with reduced DPI to save memory
                # Reduced from 300 to 150 DPI to cut memory usage by ~75%
                pages = convert_from_path(image_path, dpi=150, first_page=1, last_page=1)
                if pages:
                    pil_image = pages[0]  # PIL Image
                    # Resize if too large before converting to numpy
                    if max(pil_image.size) > max_image_dimension:
                        scale = max_image_dimension / max(pil_image.size)
                        new_size = (int(pil_image.size[0] * scale), int(pil_image.size[1] * scale))
                        pil_image = pil_image.resize(new_size, Image.LANCZOS)
                        logger.info(f"PDF image resized to: {pil_image.size}")
                    image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
                    logger.info(f"PDF converted to image, shape: {image.shape}")
                    # Clean up pages list to free memory
                    del pages
                    gc.collect()
                else:
                    raise ValueError("Could not convert PDF to image")
            else:
                logger.info("Processing image file")
                # Check image dimensions before loading full image
                pil_image_temp = Image.open(image_path)
                width, height = pil_image_temp.size
                pil_image_temp.close()
                
                # Resize if too large before loading into memory
                if max(width, height) > max_image_dimension:
                    scale = max_image_dimension / max(width, height)
                    new_size = (int(width * scale), int(height * scale))
                    pil_image = Image.open(image_path).resize(new_size, Image.LANCZOS)
                    image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_BGR2RGB)
                    logger.info(f"Image resized from {width}x{height} to {new_size}")
                else:
                    image = cv2.imread(image_path)
                    if image is not None:
                        pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            
            if image is None or pil_image is None:
                raise ValueError(f"Could not read image at {image_path}")

            # --- p-hash generation ---
            phash = str(imagehash.phash(pil_image))
            logger.info(f"Generated p-hash: {phash}")

            logger.info(f"Original image shape: {image.shape}")

            # Resize and compress image to fit under 1MB for OCR.space API
            # Further reduce size if already large to save memory
            max_size_kb = 1024
            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 70]  # Start with quality 70
            max_dim = 1500
            h, w = image.shape[:2]
            if max(h, w) > max_dim:
                scale = max_dim / max(h, w)
                # Create new resized image
                resized_image = cv2.resize(image, (int(w * scale), int(h * scale)))
                # Free old image memory
                del image
                image = resized_image
                logger.info(f"Image resized to: {image.shape}")
                gc.collect()  # Force garbage collection after resize
                
            # Compress and check size
            success, buffer = cv2.imencode('.jpg', image, encode_param)
            while success and len(buffer) > max_size_kb * 1024 and encode_param[1] > 10:
                encode_param[1] -= 10  # Lower quality
                success, buffer = cv2.imencode('.jpg', image, encode_param)
                
            logger.info(f"Encoded image size (KB): {len(buffer) / 1024}")
            
            if len(buffer) > max_size_kb * 1024:
                raise ValueError("Image could not be compressed below 1MB for OCR.space API.")
                
            base64_image = f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

            # Prepare API request
            payload = {
                'apikey': self.api_key,
                'language': 'eng',
                'isOverlayRequired': 'true',
                'OCREngine': '2',  # Using the more accurate OCR engine
                'base64Image': base64_image,
                'scale': 'true',
                'detectOrientation': 'true',
                'isTable': 'false',
                'filetype': 'jpg'
            }

            logger.info("Making API request to OCR.space...")

            # Try the API request with timeout and retries
            try:
                # Configure session with better timeout and retry settings
                session = requests.Session()
                session.mount('https://', requests.adapters.HTTPAdapter(
                    max_retries=3,
                    pool_connections=10,
                    pool_maxsize=10
                ))
                
                # Exponential backoff retry logic
                max_retries = 3
                base_delay = 2
                
                for attempt in range(max_retries):
                    try:
                        logger.info(f"Making API request to OCR.space (attempt {attempt + 1}/{max_retries})...")
                        
                        response = session.post(
                            self.api_url,
                            data=payload,
                            timeout=(15, 45)  # Increased timeouts: (connect, read)
                        )
                        
                        logger.info(f"API response status: {response.status_code}")
                        
                        # Check if request was successful
                        if response.status_code != 200:
                            error_msg = f"API request failed with status code: {response.status_code}"
                            try:
                                error_data = response.json()
                                if 'ErrorMessage' in error_data:
                                    error_msg += f"\nError: {error_data['ErrorMessage']}"
                                logger.error(f"API Error Response: {error_data}")
                            except:
                                logger.error(f"API Error Response (raw): {response.text}")
                            raise Exception(error_msg)
                        
                        # Parse JSON response
                        try:
                            result = response.json()
                            logger.info("API response parsed successfully")
                        except json.JSONDecodeError as e:
                            logger.error(f"Failed to parse API response: {response.text}")
                            raise Exception(f"Failed to parse API response as JSON: {str(e)}")

                        # Process the result
                        processed_result = self._process_result(result, image)
                        processed_result["phash"] = phash
                        logger.info("OCR processing completed successfully")
                        
                        # Clean up memory
                        del image
                        del pil_image
                        del base64_image
                        gc.collect()
                        
                        return processed_result
                        
                    except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                        logger.warning(f"API request attempt {attempt + 1} failed: {str(e)}")
                        
                        if attempt < max_retries - 1:
                            delay = base_delay * (2 ** attempt)  # Exponential backoff
                            logger.info(f"Retrying in {delay} seconds...")
                            time.sleep(delay)
                        else:
                            logger.error("All API attempts failed. OCR.space API is required for processing.")
                            raise Exception("OCR.space API request failed after all retries. Please check your API key and network connection.")
                            
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                logger.error(f"OCR API request failed after all retries: {str(e)}")
                # Clean up memory before raising error
                del image
                del pil_image
                gc.collect()
                raise Exception(f"OCR.space API request failed: {str(e)}. Please check your network connection and API key.")

        except requests.exceptions.RequestException as e:
            logger.error(f"Network error during API request: {str(e)}")
            raise Exception(f"Network error during API request: {str(e)}")
        except Exception as e:
            logger.error(f"Error during OCR processing: {str(e)}")
            raise Exception(f"Error during OCR processing: {str(e)}")

    def _validate_aadhaar_number(self, text: str) -> Optional[str]:
        """
        Validate and format the extracted Aadhaar number.
        """
        # Remove all non-digit characters
        digits = re.sub(r'\D', '', text)
        
        # Check if we have exactly 12 digits
        if len(digits) == 12:
            # Format as XXXX XXXX XXXX
            return f"{digits[:4]} {digits[4:8]} {digits[8:]}"
        return None

    def _process_result(self, result: Dict[str, Any], image: np.ndarray) -> Dict[str, Any]:
        """
        Process the OCR.space API result and extract Aadhaar number.
        """
        logger.info("Processing OCR result...")
        
        # Safely convert processing time to float
        try:
            processing_time = float(result.get("ProcessingTimeInMilliseconds", 0)) / 1000.0
        except (ValueError, TypeError):
            processing_time = 0.0

        processed = {
            "metadata": {
                "processing_time": processing_time,
                "image_dimensions": {
                    "width": image.shape[1],
                    "height": image.shape[0]
                },
                "ocr_engine": result.get("OCRExitCode", "Unknown"),
                "is_error": result.get("IsErroredOnProcessing", False)
            },
            "aadhaar_number": None,
            "confidence": 0.0,
            "debug_info": {},
            "document_hash": None
        }

        # Check for API errors
        if not isinstance(result, dict):
            processed["debug_info"]["error"] = "Invalid API response format"
            logger.error("Invalid API response format")
            return processed

        if result.get("IsErroredOnProcessing", False):
            error_msg = result.get("ErrorMessage", "Unknown error")
            processed["debug_info"]["error"] = error_msg
            logger.error(f"OCR API error: {error_msg}")
            return processed

        # Extract all text
        all_text = ""
        parsed_results = result.get("ParsedResults", [])
        
        if not parsed_results:
            processed["debug_info"]["error"] = "No text found in image"
            logger.warning("No text found in image")
            return processed

        for text_result in parsed_results:
            if isinstance(text_result, dict):
                all_text += text_result.get("ParsedText", "") + "\n"

        logger.info(f"Extracted text length: {len(all_text)} characters")

        # Generate hash of the extracted text
        processed["document_hash"] = self._generate_hash(all_text)

        # Look for 12-digit number pattern
        digits = re.findall(r'\d{12}', all_text)
        if digits:
            formatted_number = self._validate_aadhaar_number(digits[0])
            if formatted_number:
                processed["aadhaar_number"] = formatted_number
                processed["confidence"] = 1.0  # OCR.space doesn't provide confidence scores
                logger.info(f"Found Aadhaar number: {formatted_number}")

        # Store debug information
        processed["debug_info"] = {
            "raw_text": all_text,
            "found_digits": digits,
            "is_error": result.get("IsErroredOnProcessing", False),
            "error_message": result.get("ErrorMessage", None),
            "ocr_exit_code": result.get("OCRExitCode", "Unknown")
        }

        logger.info("Result processing completed")
        return processed

# Example usage
if __name__ == "__main__":
    ocr_service = OCRService()
    result = ocr_service.extract_aadhaar_number("test_images/0e0a5204f238d9c743ae456a8dc6529a_jpg.rf.077181b8bf1e43f558c2337e3b8a8dee.jpg")
    
    # Prepare data for smart contract
    try:
        contract_data = ocr_service.prepare_for_smart_contract(result)
        print("\nData ready for smart contract:")
        print(json.dumps({
            'documentHash': contract_data['hexHash'],  # Print hex hash for readability
            'name': contract_data['name'],
            'contactNumber': contract_data['contactNumber'],
            'residence': contract_data['residence']
        }, indent=2))
    except Exception as e:
        print(f"\nError preparing data for smart contract: {str(e)}") 