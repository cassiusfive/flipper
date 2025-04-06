import { Button, Card } from "@radix-ui/themes";
import { getObjectExplorerLink } from "@/utils";
import { useOwnedRepositories } from "@/hooks/useOwnedRepositories"; // Adjust the import path as needed

export function OwnedRepositories() {
    const {
        data: repositories,
        isLoading,
        error,
        refetch,
    } = useOwnedRepositories();

    return (
        <Card>
            <h2 className="font-bold" style={{ marginBottom: "1rem" }}>
                Owned Repositories
            </h2>
            <p style={{ marginBottom: "2rem" }}>
                These are all the repositories that you have created. Click
                manage to edit the repository and upload new files to the
                repository.
            </p>

            {isLoading && <p>Loading your repositories...</p>}

            {error && (
                <div>
                    <p>Error loading repositories: {error.message}</p>
                    <Button onClick={() => refetch()}>Try Again</Button>
                </div>
            )}

            {!isLoading && !error && repositories?.length === 0 && (
                <p>You don't have any repositories yet.</p>
            )}

            {!isLoading &&
                !error &&
                repositories &&
                repositories.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                        }}
                    >
                        {repositories.map((repository) => (
                            <Card
                                key={`${repository.cap_id}-${repository.repository_id}`}
                                style={{ padding: "1rem" }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <p>
                                        {repository.name} (ID{" "}
                                        <a
                                            href={getObjectExplorerLink(
                                                repository.repository_id,
                                            )}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {repository.repository_id.substring(
                                                0,
                                                8,
                                            )}
                                            ...
                                        </a>
                                        )
                                    </p>
                                    <Button
                                        onClick={() => {
                                            window.open(
                                                `${window.location.origin}/repositories/${repository.repository_id}`,
                                                "_blank",
                                            );
                                        }}
                                    >
                                        Manage
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
        </Card>
    );
}
