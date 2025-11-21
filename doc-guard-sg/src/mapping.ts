import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
    DocumentRegistered,
    DocumentVerified,
    OrganizationRegistered,
    OrganizationEdited,
    DocumentDeleted
} from "../generated/DocumentVerification/DocumentVerification";
import { Document, Verification, Organization, Admin } from "../generated/schema";

export function handleOrganizationRegistered(event: OrganizationRegistered): void {
    let org = new Organization(event.params.organizationId);
    org.name = event.params.name;
    org.description = ""; // set if available
    org.isActive = true;
    org.createdAt = event.params.timestamp;
    // Set admin as a reference to Admin entity
    let adminId = event.params.admin;
    org.admin = adminId;

    // Create Admin entity if it doesn't exist
    let admin = Admin.load(adminId);
    if (admin == null) {
        admin = new Admin(adminId);
        admin.save();
    }

    org.save();
}

export function handleDocumentRegistered(event: DocumentRegistered): void {
    let document = new Document(event.params.documentHash);
    document.documentHash = event.params.documentHash;
    document.owner = event.params.owner;
    document.timestamp = event.params.timestamp;
    document.isVerified = false;
    document.organizationId = event.params.organizationId;
    document.organization = event.params.organizationId;
    document.deleted = false;
    document.phash = event.params.phash;
    document.save();
}

export function handleDocumentVerified(event: DocumentVerified): void {
    let document = Document.load(event.params.documentHash);
    if (document == null) {
        return;
    }

    let organization = Organization.load(event.params.organizationId);
    if (organization == null) {
        return;
    }

    document.isVerified = true;
    document.save();

    let verification = new Verification(event.params.documentHash);
    verification.document = document.id;
    verification.verifier = event.params.verifier;
    verification.timestamp = event.params.timestamp;
    verification.organization = organization.id;
    verification.save();
}

export function handleOrganizationEdited(event: OrganizationEdited): void {
    let org = Organization.load(event.params.organizationId);
    if (org) {
        org.name = event.params.newName;
        org.description = event.params.newDescription;
        org.isActive = event.params.newStatus;
        org.save();
    }
}

export function handleDocumentDeleted(event: DocumentDeleted): void {
    let doc = Document.load(event.params.documentHash);
    if (doc) {
        doc.deleted = true;
        doc.save();
    }
}