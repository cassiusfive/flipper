"use client";

import { useSetPermissions } from "@/hooks/useSetPermissions";
import { Card, TextField } from "@radix-ui/themes";
import WalrusUpload from "@/EncryptAndUpload";
import { useEffect, useState } from "react";
import { useNetworkVariable } from "@/networkConfig";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";

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
    const [capId, setCapId] = useState<string | null>(null);
    const [blobIds, setBlobIds] = useState<string[]>([]);

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

    return (
        <div className="space-y-4">
            <p>
                Repository ID: <span>{id}</span>
            </p>
            <div className="grid grid-cols-2 gap-4">
                <Card className="space-y-2">
                    <h2 className="font-bold">Blobs</h2>
                    {blobIds.map((blobId) => (
                        <Card className="space-y-2" key={blobId}>
                            <p>{blobId}</p>
                            <TextField.Root placeholder="User address / group" />
                            <div className="flex items-center space-x-4 mt-4">
                                <label className="flex items-center">
                                    <input type="checkbox" className="mr-2" />
                                    <span>View Access</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="checkbox" className="mr-2" />
                                    <span>Write Access</span>
                                </label>
                                <button
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                                    type="submit"
                                >
                                    Set Permissions
                                </button>
                            </div>
                        </Card>
                    ))}
                </Card>
                {capId && (
                    <WalrusUpload
                        policyObject={id}
                        cap_id={capId}
                        moduleName="repository"
                    />
                )}
            </div>
        </div>
    );
}
