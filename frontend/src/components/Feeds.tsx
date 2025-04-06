"use client";

import { useEffect, useState } from "react";
import {
    useSignPersonalMessage,
    useSuiClient,
    useCurrentAccount,
} from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/networkConfig";
import {
    AlertDialog,
    Button,
    Card,
    Dialog,
    Flex,
    Grid,
} from "@radix-ui/themes";
import { fromHex } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { getAllowlistedKeyServers, SealClient, SessionKey } from "@mysten/seal";
import {
    downloadAndDecrypt,
    getObjectExplorerLink,
    MoveCallConstructor,
} from "@/utils";

const TTL_MIN = 10;
export interface FeedData {
    allowlistId: string;
    allowlistName: string;
    blobIds: string[];
}

function constructMoveCall(
    packageId: string,
    allowlistId: string,
): MoveCallConstructor {
    return (tx: Transaction, id: string) => {
        tx.moveCall({
            target: `${packageId}::allowlist::seal_approve`,
            arguments: [
                tx.pure.vector("u8", fromHex(id)),
                tx.object(allowlistId),
            ],
        });
    };
}

interface FeedsProps {
    allowlistId: string;
}

export const Feeds: React.FC<FeedsProps> = ({ allowlistId }) => {
    const currentAccount = useCurrentAccount();
    // Make sure currentAccount exists before accessing its properties

    // Rest of your component code unchanged
    const suiClient = useSuiClient();
    const client = new SealClient({
        suiClient,
        serverObjectIds: getAllowlistedKeyServers("testnet"),
        verifyKeyServers: false,
    });
    const packageId = useNetworkVariable("packageId");

    const [feed, setFeed] = useState<FeedData>();
    const [decryptedFileUrls, setDecryptedFileUrls] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [currentSessionKey, setCurrentSessionKey] =
        useState<SessionKey | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const { mutate: signPersonalMessage } = useSignPersonalMessage();

    useEffect(() => {
        // Call getFeed immediately
        getFeed();

        // Set up interval to call getFeed every 3 seconds
        const intervalId = setInterval(() => {
            getFeed();
        }, 3000);

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, [allowlistId, suiClient, packageId]);

    const account = useCurrentAccount();

    if (!account) {
        return <p>Please login</p>;
    }

    const { address: suiAddress } = account;

    async function getFeed() {
        // Your existing implementation
        console.log(allowlistId);

        const allowlist = await suiClient.getObject({
            id: allowlistId,
            options: { showContent: true },
        });

        const fetchBlobIds = async () => {
            // First get all dynamic fields
            const dynamicFields = await suiClient.getDynamicFields({
                parentId: allowlistId,
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
            return fieldResults
                .filter((field) => field.data?.content?.fields?.value === "3")
                .map((field) => field.data?.content?.fields?.name);
        };

        const encryptedObjects = await fetchBlobIds();
        const fields =
            (allowlist.data?.content as { fields: any })?.fields || {};
        const feedData = {
            allowlistId: allowlistId,
            allowlistName: fields?.name,
            blobIds: encryptedObjects,
        };
        setFeed(feedData);
    }

    const onView = async (blobIds: string[], allowlistId: string) => {
        // Your existing implementation
        // (Implementation omitted for brevity but would remain unchanged)
    };

    // Your existing JSX return
    return (
        <Card>
            <h2 style={{ marginBottom: "1rem" }}>
                Files for Allowlist {feed?.allowlistName} (ID{" "}
                {feed?.allowlistId && getObjectExplorerLink(feed.allowlistId)})
            </h2>
            {feed === undefined ? (
                <p>No files found for this allowlist.</p>
            ) : (
                <Grid columns="2" gap="3">
                    <Card key={feed!.allowlistId}>
                        <Flex direction="column" align="start" gap="2">
                            {feed!.blobIds.length === 0 ? (
                                <p>No files found for this allowlist.</p>
                            ) : (
                                <Dialog.Root
                                    open={isDialogOpen}
                                    onOpenChange={setIsDialogOpen}
                                >
                                    <Dialog.Trigger>
                                        <Button
                                            onClick={() =>
                                                onView(
                                                    feed!.blobIds,
                                                    feed!.allowlistId,
                                                )
                                            }
                                        >
                                            Download And Decrypt All Files
                                        </Button>
                                    </Dialog.Trigger>
                                    {decryptedFileUrls.length > 0 && (
                                        <Dialog.Content
                                            maxWidth="450px"
                                            key={reloadKey}
                                        >
                                            <Dialog.Title>
                                                View all files retrieved from
                                                Walrus
                                            </Dialog.Title>
                                            <Flex direction="column" gap="2">
                                                {decryptedFileUrls.map(
                                                    (
                                                        decryptedFileUrl,
                                                        index,
                                                    ) => (
                                                        <div key={index}>
                                                            <img
                                                                src={
                                                                    decryptedFileUrl
                                                                }
                                                                alt={`Decrypted image ${index + 1}`}
                                                            />
                                                        </div>
                                                    ),
                                                )}
                                            </Flex>
                                            <Flex gap="3" mt="4" justify="end">
                                                <Dialog.Close>
                                                    <Button
                                                        variant="soft"
                                                        color="gray"
                                                        onClick={() =>
                                                            setDecryptedFileUrls(
                                                                [],
                                                            )
                                                        }
                                                    >
                                                        Close
                                                    </Button>
                                                </Dialog.Close>
                                            </Flex>
                                        </Dialog.Content>
                                    )}
                                </Dialog.Root>
                            )}
                        </Flex>
                    </Card>
                </Grid>
            )}
            <AlertDialog.Root
                open={!!error}
                onOpenChange={() => setError(null)}
            >
                <AlertDialog.Content maxWidth="450px">
                    <AlertDialog.Title>Error</AlertDialog.Title>
                    <AlertDialog.Description size="2">
                        {error}
                    </AlertDialog.Description>

                    <Flex gap="3" mt="4" justify="end">
                        <AlertDialog.Action>
                            <Button
                                variant="solid"
                                color="gray"
                                onClick={() => setError(null)}
                            >
                                Close
                            </Button>
                        </AlertDialog.Action>
                    </Flex>
                </AlertDialog.Content>
            </AlertDialog.Root>
        </Card>
    );
};
