"use client";

import { useSetPermissions } from "@/hooks/useSetPermissions";
import { Card, TextField } from "@radix-ui/themes";
import WalrusUpload from "@/EncryptAndUpload";
import { useEffect, useState } from "react";
import { useNetworkVariable } from "@/networkConfig";
import { Transaction } from "@mysten/sui/transactions";
import {
    useCurrentAccount,
    useSignAndExecuteTransaction,
    useSuiClient,
} from "@mysten/dapp-kit";
import Link from "next/link";

const BlobCard = ({ blobId, onSetPermissions }) => {
    const [address, setAddress] = useState("");
    const [viewAccess, setViewAccess] = useState(false);
    const [writeAccess, setWriteAccess] = useState(false);

    const { mutateAsync: signAndExecuteTransaction } =
        useSignAndExecuteTransaction();

    const handleSubmit = () => {
        onSetPermissions(blobId, address, viewAccess, writeAccess);
    };

    return (
        <Card className="space-y-2" key={blobId}>
            <p>{blobId}</p>
            <TextField.Root
                placeholder="User address / group"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
            />
            <div className="flex items-center space-x-4 mt-4">
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        className="mr-2"
                        checked={viewAccess}
                        onChange={(e) => setViewAccess(e.target.checked)}
                    />
                    <span>View Access</span>
                </label>
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        className="mr-2"
                        checked={writeAccess}
                        onChange={(e) => setWriteAccess(e.target.checked)}
                    />
                    <span>Write Access</span>
                </label>
                <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                    type="button"
                    onClick={handleSubmit}
                >
                    Set Permissions
                </button>
            </div>
        </Card>
    );
};

interface RepositoryPageParams {
    id: string;
}

interface RepositoryPageSearchParams {
    view?: string;
}

// In your page component
export default function RepositoryPage({
    params,
    searchParams,
}: {
    params: RepositoryPageParams;
    searchParams: RepositoryPageSearchParams;
}) {
    // const { mutate: setPermissions } = useSetPermissions({});
    const { id } = params;
    const view = searchParams.view || "normal";

    const packageId = useNetworkVariable("packageId");
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutateAsync: signAndExecuteTransaction } =
        useSignAndExecuteTransaction();
    const [capId, setCapId] = useState<string | null>(null);
    const [blobIds, setBlobIds] = useState<string[]>([]);
    const [userAddress, setUserAddress] = useState("");
    const [groupAddress, setGroupAddress] = useState("");

    useEffect(() => {
        const fetchCapId = async () => {
            if (!currentAccount) return;

            const res = await suiClient.getOwnedObjects({
                owner: currentAccount.address,
                options: {
                    showContent: true,
                    showType: true,
                },
                filter: {
                    StructType: `${packageId}::repository::AdminCap`,
                },
            });

            // Extract cap information
            const cap = res.data
                .map((obj) => {
                    const fields = (obj!.data!.content as { fields: any })
                        .fields;
                    return {
                        id: fields?.id.id,
                        repository_id: fields?.repository_id,
                    };
                })
                .find((item) => item !== null && item.repository_id == id);

            if (cap) {
                setCapId(cap.id);
            }
        };

        fetchCapId();
    }, [currentAccount, suiClient, packageId, id]);

    useEffect(() => {
        const fetchBlobIds = async () => {
            // First get all dynamic fields
            const dynamicFields = await suiClient.getDynamicFields({
                parentId: id,
            });

            // Create an array of promises to fetch all field contents in parallel
            const fieldPromises = dynamicFields.data.map((obj) =>
                suiClient.getObject({
                    id: obj.objectId,
                    options: { showContent: true },
                }),
            );

            // Wait for all promises to resolve
            const fieldResults = await Promise.all(fieldPromises);

            // Filter for fields with value "3"
            console.log(
                fieldResults.filter(
                    (field) => field.data?.content?.fields?.value === "3",
                ),
            );
            setBlobIds(
                fieldResults
                    .filter(
                        (field) => field.data?.content?.fields?.value === "3",
                    )
                    .map((field) => field.data?.content?.fields?.name),
            );
        };

        fetchBlobIds();
    }, [id, suiClient]);

    const handleSetPermissions = (blobId, address, viewAccess, writeAccess) => {
        // Add logic to set permissions here
        console.log("Setting permissions for blob:", blobId);
        console.log("Address:", address);
        console.log("View access:", viewAccess);
        console.log("Write access:", writeAccess);
        // Implement your permission setting logic here
    };

    return (
        <div className="space-y-4">
            <div>
                <p className="font-bold">-- ADMIN VIEW --</p>
                <Link href={`/repositories/${id}/view`} target="_blank">
                    regular view
                </Link>
            </div>
            <p>
                Repository ID: <span>{id}</span>
            </p>
            <div className="grid grid-cols-2 gap-4">
                <Card className="space-y-2">
                    <h2 className="font-bold">Blobs</h2>
                    {blobIds.map((blobId) => (
                        <BlobCard
                            key={blobId}
                            blobId={blobId}
                            onSetPermissions={handleSetPermissions}
                        />
                    ))}
                </Card>
                {capId && (
                    <WalrusUpload
                        policyObject={id}
                        cap_id={capId}
                        moduleName="repository"
                    />
                )}
                <Card className="p-4 space-y-4">
                    <h2 className="font-bold">Assign User to Group</h2>
                    <TextField.Root
                        placeholder="User address"
                        value={userAddress}
                        onChange={(e) => setUserAddress(e.target.value)}
                    />
                    <TextField.Root
                        placeholder="Group address"
                        value={groupAddress}
                        onChange={(e) => setGroupAddress(e.target.value)}
                    />
                    <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md w-full max-w-60"
                        type="submit"
                        onClick={async () => {
                            const tx = new Transaction();

                            tx.moveCall({
                                target: `${packageId}::repository::assign_user_to_group`,
                                arguments: [
                                    tx.object(id),
                                    tx.object(capId!),
                                    tx.pure.address(userAddress.trim()),
                                    tx.pure.address(groupAddress.trim()),
                                ],
                            });

                            tx.setGasBudget(10000000);
                            await signAndExecuteTransaction({
                                transaction: tx,
                            });
                        }}
                    >
                        Assign User to Group
                    </button>
                </Card>
            </div>
        </div>
    );
}
