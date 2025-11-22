"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import DocumentVerificationArtifact from "../../src/abis/DocumentVerification.json";
import { Building2, Sparkles, FileText, Edit, Eye, Trash2, BarChart2 } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalFooter } from "../../components/ui/modal";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/text-area";
import { Switch } from "../../components/ui/switch";
import Link from "next/link";

const CONTRACT_ADDRESS = "0x3A632ee2c3F3B8BaFb85acD06427a2E3728d7F69"; // updated contract address
const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/111188/doc-guard-sg/0.7.0";

export default function AdminProfilePage() {
    const { address, isConnected } = useAccount();
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [stats, setStats] = useState({ orgs: 0, docs: 0, verifications: 0 });
    const [editOrg, setEditOrg] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");
    const [showDocsOrgId, setShowDocsOrgId] = useState(null);
    const [docs, setDocs] = useState([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [docsError, setDocsError] = useState("");
    const [deleteLoading, setDeleteLoading] = useState("");
    const [mounted, setMounted] = useState(false);
    const [loadingOrgId, setLoadingOrgId] = useState(null);
    const [orgDocuments, setOrgDocuments] = useState({});
    const [docsLoadingOrgId, setDocsLoadingOrgId] = useState(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchOrgsAndStats = async () => {
            setLoading(true);
            setError("");
            setOrgs([]);
            setStats({ orgs: 0, docs: 0, verifications: 0 });
            if (!address) {
                setLoading(false);
                return;
            }
            try {
                let provider;
                if (window.ethereum) {
                    provider = new ethers.BrowserProvider(window.ethereum);
                } else {
                    const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
                    provider = new ethers.JsonRpcProvider(rpcUrl);
                }
                const contract = new ethers.Contract(CONTRACT_ADDRESS, DocumentVerificationArtifact.abi, provider);
                const orgIds = await contract.getAdminOrganizations(address);
                const orgDetails = await Promise.all(
                    orgIds.map(async (orgId) => {
                        const details = await contract.getOrganizationDetails(orgId);
                        return {
                            orgId,
                            name: details[0],
                            description: details[1],
                            admin: details[2],
                            isActive: details[3],
                            createdAt: details[4],
                        };
                    })
                );
                setOrgs(orgDetails);
                const statsQuery = `{
                    organizations { id }
                    documents(where: { deleted: false }) { id }
                    verifications { id }
                }`;
                const res = await fetch(SUBGRAPH_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query: statsQuery }),
                });
                const data = await res.json();
                setStats({
                    orgs: data.data.organizations.length,
                    docs: data.data.documents.length,
                    verifications: data.data.verifications.length,
                });
            } catch (err) {
                setError("Failed to fetch organizations or stats. Make sure you are connected to the correct network and have registered organizations.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrgsAndStats();
    }, [address]);

    const fetchDocumentsForOrg = async (orgId) => {
        const normalizedOrgId = ethers.hexlify(orgId).toLowerCase();
        console.log("Fetching docs for orgId:", normalizedOrgId);
        const query = `{
            documents(where: { organizationId: "${normalizedOrgId}", deleted: false }) {
                id
                documentHash
                owner
                timestamp
                
            }
        }`;
        const res = await fetch(SUBGRAPH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        });
        const data = await res.json();
        console.log("Subgraph response for docs:", data);
        if (data.errors) {
            console.error("Subgraph errors:", data.errors);
        }
        return data.data.documents || [];
    };

    const handleViewDocuments = async (orgId) => {
        setDocsLoadingOrgId(orgId);
        const docs = await fetchDocumentsForOrg(orgId);
        setOrgDocuments(prev => ({ ...prev, [orgId]: docs }));
        setDocsLoadingOrgId(null);
    };

    const handleEditOrg = (org) => {
        setEditOrg(org);
        setEditError("");
    };

    const handleEditOrgSave = async () => {
        setEditLoading(true);
        setEditError("");
        try {
            let provider;
            if (window.ethereum) {
                provider = new ethers.BrowserProvider(window.ethereum);
            } else {
                const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
                provider = new ethers.JsonRpcProvider(rpcUrl);
            }
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, DocumentVerificationArtifact.abi, signer);
            const tx = await contract.editOrganization(
                editOrg.orgId,
                editOrg.name,
                editOrg.description,
                editOrg.isActive
            );
            await tx.wait();
            setEditOrg(null);
            setLoading(true);
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            setEditError("Failed to edit organization. " + (err?.message || ""));
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteDocument = async (orgId, docHash) => {
        setDeleteLoading(docHash);
        try {
            let provider;
            if (window.ethereum) {
                provider = new ethers.BrowserProvider(window.ethereum);
            } else {
                const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
                provider = new ethers.JsonRpcProvider(rpcUrl);
            }
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, DocumentVerificationArtifact.abi, signer);
            const tx = await contract.deleteDocument(orgId, docHash);
            await tx.wait();
            await handleViewDocuments(orgId);
        } catch (err) {
            alert("Failed to delete document: " + (err?.message || ""));
        } finally {
            setDeleteLoading("");
        }
    };

    const handleToggleActive = async (org) => {
        setLoadingOrgId(org.orgId);
        try {
            let provider;
            if (window.ethereum) {
                provider = new ethers.BrowserProvider(window.ethereum);
            } else {
                const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
                provider = new ethers.JsonRpcProvider(rpcUrl);
            }
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, DocumentVerificationArtifact.abi, signer);
            await contract.editOrganization(
                org.orgId,
                org.name,
                org.description,
                !org.isActive
            );
            setTimeout(() => {
                setLoadingOrgId(null);
                (async () => {
                    const orgIds = await contract.getAdminOrganizations(address);
                    const orgDetails = await Promise.all(
                        orgIds.map(async (orgId) => {
                            const details = await contract.getOrganizationDetails(orgId);
                            return {
                                orgId,
                                name: details[0],
                                description: details[1],
                                admin: details[2],
                                isActive: details[3],
                                createdAt: details[4],
                            };
                        })
                    );
                    setOrgs(orgDetails);
                })();
            }, 2000);
        } catch (err) {
            setLoadingOrgId(null);
        }
    };

    if (!mounted) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/5 to-cyan-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
            </div>
            <main className="relative container mx-auto px-4 py-12">
                <div className="mb-6 flex items-center">
                    <Link href="/">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            Back
                        </Button>
                    </Link>
                </div>
                <div className="mb-12 text-center">
                    <h2 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-lg flex items-center justify-center gap-3">
                        <Building2 className="w-10 h-10 text-blue-500 drop-shadow" />
                        Admin Dashboard
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Manage your organizations and documents.</p>
                </div>
                {!isConnected ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <p className="mb-4 text-lg font-medium text-muted-foreground">Connect your wallet to view your organizations.</p>
                        <ConnectButton />
                    </div>
                ) : loading ? (
                    <div className="text-center text-muted-foreground py-10">Loading organizations...</div>
                ) : error ? (
                    <div className="text-center text-red-500 py-10">{error}</div>
                ) : orgs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">No active organizations found. Register an organization to get started.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {orgs.map((org, idx) => (
                            <div key={org.orgId} className="relative">
                                <Card className="shadow-xl border-0 bg-white/30 dark:bg-background/60 backdrop-blur-lg ring-1 ring-inset ring-white/20 hover:scale-[1.015] transition-transform duration-200">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-2xl">
                                            <Building2 className="w-6 h-6 text-blue-500" />
                                            <span className="truncate max-w-xs">{org.name}</span>
                                            <Badge variant={org.isActive ? "outline" : "destructive"} className="ml-2">{org.isActive ? "Active" : "Inactive"}</Badge>
                                            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => handleEditOrg(org)}>
                                                <Edit className="w-4 h-4" /> Edit
                                            </Button>
                                        </CardTitle>
                                        <CardDescription className="mt-2 text-base text-muted-foreground">
                                            {org.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-col gap-3">
                                            <div className="text-xs text-muted-foreground">
                                                <span className="font-semibold">Org ID:</span> <span className="font-mono">{org.orgId.slice(0, 10)}...</span><br />
                                                <span className="font-semibold">Created:</span> {new Date(Number(org.createdAt) * 1000).toLocaleString()}
                                            </div>
                                            <Button size="sm" variant="outline" className="mt-2 w-fit" onClick={() => handleViewDocuments(org.orgId)}>
                                                <Eye className="w-4 h-4 mr-1" /> View Documents
                                            </Button>
                                            {docsLoadingOrgId === org.orgId && <span className="ml-2 text-xs text-gray-500">Loading...</span>}
                                            {orgDocuments[org.orgId] && (
                                                <div className="mt-3">
                                                    {orgDocuments[org.orgId].length === 0 ? (
                                                        <div className="text-sm text-muted-foreground">No documents found.</div>
                                                    ) : (
                                                        <ul className="space-y-3">
                                                            {orgDocuments[org.orgId].map(doc => (
                                                                <li key={doc.id} className="p-3 border rounded-lg bg-white/60 dark:bg-muted/30 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                                                    <div>
                                                                        <div className="font-mono text-xs break-all text-blue-900 dark:text-blue-300">Hash: {doc.documentHash}</div>
                                                                        <div className="text-xs text-muted-foreground">Owner: {doc.owner}</div>
                                                                        <div className="text-xs text-muted-foreground">Timestamp: {doc.timestamp}</div>
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        disabled={deleteLoading === doc.documentHash}
                                                                        onClick={() => handleDeleteDocument(org.orgId, doc.documentHash)}
                                                                    >
                                                                        {deleteLoading === doc.documentHash ? "Deleting..." : "Delete"}
                                                                    </Button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                <Switch
                                                    checked={org.isActive}
                                                    onCheckedChange={() => handleToggleActive(org)}
                                                />
                                                <span className="ml-2 text-sm">{org.isActive ? "Active" : "Inactive"}</span>
                                                {loadingOrgId === org.orgId && <span className="ml-2 text-xs text-gray-500">Updating...</span>}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                {idx < orgs.length - 1 && <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-sm" />}
                            </div>
                        ))}
                    </div>
                )}
                {editOrg && (
                    <Modal open={!!editOrg} onClose={() => setEditOrg(null)}>
                        <ModalHeader>Edit Organization</ModalHeader>
                        <ModalContent>
                            <div className="space-y-4">
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <Input
                                    value={editOrg.name}
                                    onChange={e => setEditOrg({ ...editOrg, name: e.target.value })}
                                />
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <Textarea
                                    value={editOrg.description}
                                    onChange={e => setEditOrg({ ...editOrg, description: e.target.value })}
                                />
                                <div className="flex items-center gap-2">
                                    <span>Status:</span>
                                    <Switch
                                        checked={editOrg.isActive}
                                        onCheckedChange={checked => setEditOrg({ ...editOrg, isActive: checked })}
                                    />
                                    <span>{editOrg.isActive ? "Active" : "Inactive"}</span>
                                </div>
                                {editError && <div className="text-red-500 text-sm">{editError}</div>}
                            </div>
                        </ModalContent>
                        <ModalFooter>
                            <Button onClick={handleEditOrgSave} disabled={editLoading}>
                                {editLoading ? "Saving..." : "Save"}
                            </Button>
                            <Button variant="ghost" onClick={() => setEditOrg(null)} disabled={editLoading}>Cancel</Button>
                        </ModalFooter>
                    </Modal>
                )}
            </main>
        </div>
    );
} 