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
    const { id } = params;
    const view = searchParams.view || "normal";

    return (
        <div>
            {id} {view}
        </div>
    );
}
