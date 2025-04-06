import { NextRequest, NextResponse } from "next/server";

const proxyMap: Record<string, string> = {
    aggregator1: "https://aggregator.walrus-testnet.walrus.space",
    aggregator2: "https://wal-aggregator-testnet.staketab.org",
    aggregator3: "https://walrus-testnet-aggregator.redundex.com",
    aggregator4: "https://walrus-testnet-aggregator.nodes.guru",
    aggregator5: "https://aggregator.walrus.banansen.dev",
    aggregator6: "https://walrus-testnet-aggregator.everstake.one",
    publisher1: "https://publisher.walrus-testnet.walrus.space",
    publisher2: "https://wal-publisher-testnet.staketab.org",
    publisher3: "https://walrus-testnet-publisher.redundex.com",
    publisher4: "https://walrus-testnet-publisher.nodes.guru",
    publisher5: "https://publisher.walrus.banansen.dev",
    publisher6: "https://walrus-testnet-publisher.everstake.one",
};

export function middleware(req: NextRequest) {
    const { pathname, search } = req.nextUrl;

    const match = pathname.match(/^\/(aggregator\d|publisher\d)(\/.*)?$/);
    if (!match) return NextResponse.next();

    const [_, key, pathSuffix] = match;
    const target = proxyMap[key];

    if (!target) return new Response("Invalid proxy key", { status: 404 });

    const rewrittenPath = pathSuffix || "";
    const proxyUrl = `${target}${rewrittenPath}${search}`;

    return NextResponse.rewrite(proxyUrl);
}

export const config = {
    matcher: [
        "/aggregator1/:path*",
        "/aggregator2/:path*",
        "/aggregator3/:path*",
        "/aggregator4/:path*",
        "/aggregator5/:path*",
        "/aggregator6/:path*",
        "/publisher1/:path*",
        "/publisher2/:path*",
        "/publisher3/:path*",
        "/publisher4/:path*",
        "/publisher5/:path*",
        "/publisher6/:path*",
    ],
};
