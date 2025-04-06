import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useNetworkVariable } from "@/networkConfig";

export interface Cap {
    id: string;
    repository_id: string;
}

export interface Repository {
    cap_id: string;
    repository_id: string;
    list: string[];
    name: string;
}

export function useOwnedRepositories(): UseQueryResult<Repository[], Error> {
    const packageId = useNetworkVariable("packageId");
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();

    // Define the query key for caching
    const queryKey = ["repositories", currentAccount?.address, packageId];

    // Define the query function
    const fetchRepositories = async (): Promise<Repository[]> => {
        if (!currentAccount?.address) return [];

        // Fetch admin caps owned by the current account
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
        const caps = res.data
            .map((obj) => {
                const fields = (obj!.data!.content as { fields: any }).fields;
                return {
                    id: fields?.id.id,
                    repository_id: fields?.repository_id,
                };
            })
            .filter((item) => item !== null) as Cap[];

        // Fetch repository details for each cap
        const repositories: Repository[] = await Promise.all(
            caps.map(async (cap) => {
                const repository = await suiClient.getObject({
                    id: cap.repository_id,
                    options: { showContent: true },
                });
                const fields =
                    (repository.data?.content as { fields: any })?.fields || {};
                return {
                    cap_id: cap.id,
                    repository_id: cap.repository_id,
                    list: fields.list,
                    name: fields.name,
                };
            }),
        );

        return repositories;
    };

    // Use React Query for data fetching
    return useQuery({
        queryKey,
        queryFn: fetchRepositories,
        enabled: !!currentAccount?.address,
        refetchInterval: 10000,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
    });
}
