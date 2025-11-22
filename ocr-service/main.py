from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ocr_service import OCRService
import shutil
import os
import tempfile
import cv2
import numpy as np
from pdf2image import convert_from_path
import traceback
import logging
import asyncio
import aiohttp
from datetime import datetime
from contextlib import asynccontextmanager

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variable to store the keep-alive task
keep_alive_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    global keep_alive_task
    
    # Startup
    logger.info("Starting OCR service...")
    keep_alive_task = asyncio.create_task(keep_alive_loop())
    logger.info("Keep-alive task started")
    
    yield
    
    # Shutdown
    logger.info("Shutting down OCR service...")
    if keep_alive_task:
        keep_alive_task.cancel()
        try:
            await keep_alive_task
        except asyncio.CancelledError:
            pass
    logger.info("Keep-alive task cancelled")

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://*.vercel.app",
        "https://*.vercel.com",
        "https://doc-guard-taupe.vercel.app",
        "https://doc-guard-mdkx8sa4e-shivansh-see-saw07s-projects.vercel.app",
        "https://doc-guard.vercel.app",
        "https://doc-guard-git-main.vercel.app",
        "https://doc-guard-git-develop.vercel.app",
        "*"  # Allow all origins temporarily for debugging
    ],  # Allow Vercel domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

ocr_service = OCRService()

async def keep_alive_loop():
    """Keep-alive loop that pings the service every 10 minutes"""
    while True:
        try:
            # Wait 10 minutes
            await asyncio.sleep(600)
            
            # Ping the health endpoint
            async with aiohttp.ClientSession() as session:
                async with session.get("https://ocr-service-1.onrender.com/health") as response:
                    if response.status == 200:
                        logger.info(f"Keep-alive ping successful at {datetime.now()}")
                    else:
                        logger.warning(f"Keep-alive ping failed with status {response.status}")
        except Exception as e:
            logger.error(f"Keep-alive ping error: {e}")
            # Continue trying even if ping fails
            await asyncio.sleep(60)  # Wait 1 minute before retrying

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ocr-service", "timestamp": datetime.now().isoformat()}

@app.get("/keep-alive")
async def keep_alive():
    """Manual keep-alive endpoint"""
    return {"status": "awake", "timestamp": datetime.now().isoformat()}

@app.options("/ocr")
async def ocr_options():
    """Handle CORS preflight requests"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.post("/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    # Save uploaded file to a temporary location
    try:
        logger.info(f"Processing file: {file.filename}, size: {file.size} bytes")
        
        # Validate file type
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "application/pdf", "image/tiff", "image/bmp"]
        if file.content_type not in allowed_types:
            return JSONResponse(content={
                'success': False,
                'error': f"Unsupported file type: {file.content_type}. Supported types: {allowed_types}"
            }, status_code=400)
        
        # Validate file size (16MB limit)
        if file.size > 16 * 1024 * 1024:
            return JSONResponse(content={
                'success': False,
                'error': "File size must be less than 16MB"
            }, status_code=400)
        
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        
        logger.info(f"File saved to temporary path: {tmp_path}")
        
        # Run OCR
        logger.info("Starting OCR processing...")
        result = ocr_service.extract_aadhaar_number(tmp_path)
        logger.info("OCR processing completed successfully")
        
        # Prepare for smart contract (hash, fields)
        logger.info("Preparing data for smart contract...")
        prepared = ocr_service.prepare_for_smart_contract(result)
        logger.info("Data prepared successfully")
        
        # Log the response being sent
        response_data = {
            'success': True,
            'data': prepared
        }
        logger.info(f"Sending response: {response_data}")
        
        # Clean up temp file
        os.remove(tmp_path)
        logger.info("Temporary file cleaned up")
        
        # Force garbage collection to free memory
        import gc
        gc.collect()
        
        return JSONResponse(content=response_data)
        
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Clean up temp file if it exists
        try:
            if 'tmp_path' in locals():
                os.remove(tmp_path)
        except:
            pass
        
        return JSONResponse(content={
            'success': False,
            'error': f"OCR processing failed: {str(e)}"
        }, status_code=500) 
