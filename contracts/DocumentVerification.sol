// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract DocumentVerification is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");

    struct Organization {
        string name;
        string description;
        address admin;
        bool isActive;
        uint256 createdAt;
    }

    struct Document {
        bytes32 documentHash;
        address owner;
        uint256 timestamp;
        bool isVerified;
        bytes32 organizationId;
        string phash;
    }

    mapping(bytes32 => Organization) public organizations;
    mapping(bytes32 => Document) public documents;
    mapping(bytes32 => bool) public documentExists;
    mapping(address => bytes32[]) public adminOrganizations;
    mapping(bytes32 => mapping(bytes32 => bool)) public organizationDocuments;
    bytes32[] public allOrganizationIds;

    event OrganizationRegistered(
        bytes32 indexed organizationId,
        string name,
        address admin,
        uint256 timestamp
    );

    event DocumentRegistered(
        bytes32 indexed documentHash,
        bytes32 indexed organizationId,
        address owner,
        uint256 timestamp,
        string phash
    );

    event DocumentVerified(
        bytes32 indexed documentHash,
        bytes32 indexed organizationId,
        address verifier,
        uint256 timestamp
    );

    event DocumentDeleted(bytes32 indexed documentHash, bytes32 indexed organizationId, address admin, uint256 timestamp);
    event OrganizationEdited(bytes32 indexed organizationId, string newName, string newDescription, bool newStatus, address admin, uint256 timestamp);

    error DocumentAlreadyRegistered();
    error DocumentNotFound();
    error AlreadyVerified();
    error EmptyInput();
    error NotAuthorized();
    error OrganizationNotFound();
    error NotOrganizationAdmin();

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE); // Ensure DEFAULT_ADMIN can manage ADMIN_ROLE
    }

    /**
     * @dev Register a new organization - OPTION 1: Remove role granting
     * @param _name Organization name
     * @param _description Organization description
     */
    function registerOrganization(
        string calldata _name,
        string calldata _description
    ) external {
        if (bytes(_name).length == 0) {
            revert EmptyInput();
        }

        bytes32 organizationId = keccak256(
            abi.encodePacked(_name, msg.sender, block.timestamp)
        );

        organizations[organizationId] = Organization({
            name: _name,
            description: _description,
            admin: msg.sender,
            isActive: true,
            createdAt: block.timestamp
        });

        adminOrganizations[msg.sender].push(organizationId);
        allOrganizationIds.push(organizationId);
        

        emit OrganizationRegistered(
            organizationId,
            _name,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Alternative: Function for contract admin to grant ADMIN_ROLE to organization admins
     * Only callable by DEFAULT_ADMIN_ROLE holders
     */
    function grantAdminRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ADMIN_ROLE, account);
    }

    /**
     * @dev Get all organizations for a given admin
     * @param admin The address of the admin
     */
    function getAdminOrganizations(address admin) external view returns (bytes32[] memory) {
        return adminOrganizations[admin];
    }

    /**
     * @dev Register a new document with precomputed hash
     * @param organizationId The ID of the organization
     * @param _documentHash Hash of document content (from OCR processing)
     * @param phash The p-hash of the document
     */
    function registerDocument(
        bytes32 organizationId,
        bytes32 _documentHash,
        string calldata phash
    ) external {
        // OPTION 1: Check organization admin instead of contract admin role
        Organization memory org = organizations[organizationId];
        if (org.admin == address(0)) {
            revert OrganizationNotFound();
        }
        if (org.admin != msg.sender) {
            revert NotOrganizationAdmin();
        }

        // OPTION 2: Keep role check but make it more flexible
        // if (!hasRole(ADMIN_ROLE, msg.sender) && org.admin != msg.sender) {
        //     revert NotAuthorized();
        // }

        if (documentExists[_documentHash]) {
            revert DocumentAlreadyRegistered();
        }

        documents[_documentHash] = Document({
            documentHash: _documentHash,
            owner: msg.sender,
            timestamp: block.timestamp,
            isVerified: false,
            organizationId: organizationId,
            phash: phash
        });

        documentExists[_documentHash] = true;
        organizationDocuments[organizationId][_documentHash] = true;

        emit DocumentRegistered(
            _documentHash,
            organizationId,
            msg.sender,
            block.timestamp,
            phash
        );
    }

    /**
     * @dev Verify a document against organization records
     * @param _documentHash The hash of the document to verify
     * @param _organizationId The organization to verify against
     */
    function verifyDocument(
        bytes32 _documentHash,
        bytes32 _organizationId
    ) external {
        if (!documentExists[_documentHash]) {
            revert DocumentNotFound();
        }

        if (!organizationDocuments[_organizationId][_documentHash]) {
            revert DocumentNotFound();
        }

        Document storage doc = documents[_documentHash];

        if (doc.isVerified) {
            revert AlreadyVerified();
        }

        doc.isVerified = true;
        emit DocumentVerified(_documentHash, _organizationId, msg.sender, block.timestamp);
    }

    /**
     * @dev Get document details
     * @param _documentHash The hash of the document
     */
    function getDocumentDetails(
        bytes32 _documentHash
    )
        external
        view
        returns (
            address owner,
            uint256 timestamp,
            bool isVerified,
            bytes32 organizationId
        )
    {
        if (!documentExists[_documentHash]) {
            revert DocumentNotFound();
        }

        Document memory doc = documents[_documentHash];
        return (
            doc.owner,
            doc.timestamp,
            doc.isVerified,
            doc.organizationId
        );
    }

    /**
     * @dev Get organization details
     * @param _organizationId The organization ID
     */
    function getOrganizationDetails(
        bytes32 _organizationId
    )
        external
        view
        returns (
            string memory name,
            string memory description,
            address admin,
            bool isActive,
            uint256 createdAt
        )
    {
        Organization memory org = organizations[_organizationId];
        if (org.admin == address(0)) {
            revert OrganizationNotFound();
        }

        return (
            org.name,
            org.description,
            org.admin,
            org.isActive,
            org.createdAt
        );
    }

    /**
     * @dev Edit organization details (name, description, isActive)
     * @param _organizationId The organization ID
     * @param _name New name
     * @param _description New description
     * @param _isActive New status
     */
    function editOrganization(
        bytes32 _organizationId,
        string calldata _name,
        string calldata _description,
        bool _isActive
    ) external {
        Organization storage org = organizations[_organizationId];
        if (org.admin == address(0)) {
            revert OrganizationNotFound();
        }
        if (org.admin != msg.sender) {
            revert NotOrganizationAdmin();
        }
        if (bytes(_name).length == 0) {
            revert EmptyInput();
        }
        org.name = _name;
        org.description = _description;
        org.isActive = _isActive;
        emit OrganizationEdited(_organizationId, _name, _description, _isActive, msg.sender, block.timestamp);
    }

    /**
     * @dev Delete a document from an organization (admin only)
     * @param organizationId The ID of the organization
     * @param documentHash The hash of the document to delete
     */
    function deleteDocument(bytes32 organizationId, bytes32 documentHash) external {
        Organization memory org = organizations[organizationId];
        if (org.admin == address(0)) {
            revert OrganizationNotFound();
        }
        if (org.admin != msg.sender) {
            revert NotOrganizationAdmin();
        }
        if (!documentExists[documentHash]) {
            revert DocumentNotFound();
        }
        if (!organizationDocuments[organizationId][documentHash]) {
            revert DocumentNotFound();
        }
        // Remove from mappings
        delete documents[documentHash];
        documentExists[documentHash] = false;
        organizationDocuments[organizationId][documentHash] = false;
        emit DocumentDeleted(documentHash, organizationId, msg.sender, block.timestamp);
    }

    function getAllOrganizationIds() external view returns (bytes32[] memory) {
        return allOrganizationIds;
    }
}