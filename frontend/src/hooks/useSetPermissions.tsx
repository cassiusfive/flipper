import { useCurrentAccount } from "@mysten/dapp-kit";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "@/networkConfig";
import { fromHex } from "@mysten/sui/utils";

export interface SetPermissionsParams {
    repositoryId: string;
    adminCapId: string;
    userGroupAddress: string;
    id: string; // The id vector represented as a hex string
    permissions: number;
}

export function useSetPermissions({
    repositoryId,
    adminCapId,
    userGroupAddress,
    id,
    permissions,
}: SetPermissionsParams) {
    const packageId = useNetworkVariable("packageId");
    const currentAccount = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } =
        useSignAndExecuteTransaction();

    if (!currentAccount?.address) {
    }

    // Create a new transaction block
    const tx = new Transaction();

    // Set up the call to set_permissions
    tx.moveCall({
        target: `${packageId}::repository::set_permissions`,
        arguments: [
            tx.object(repositoryId), // Repository object
            tx.object(adminCapId), // AdminCap object
            tx.pure.address(userGroupAddress), // User or group address
            tx.pure.vector("u8", fromHex(id)), // ID bytes
            tx.pure.u64(permissions), // Permissions as a u64
        ],
    });

    // Sign and execute the transaction
    return signAndExecuteTransaction({
        transaction: tx,
    });
}
