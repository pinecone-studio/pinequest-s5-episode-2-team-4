import { landscapeSvg } from "@/components/layout/landscape";

// Prerendered at build time: /landscape/light.svg and /landscape/dark.svg. The
// ".svg" ending also keeps them out of the login check in proxy.ts.
export function generateStaticParams() {
  return [{ file: "light.svg" }, { file: "dark.svg" }];
}

export async function GET(_request: Request, { params }: RouteContext<"/landscape/[file]">) {
  const { file } = await params;
  if (file !== "light.svg" && file !== "dark.svg") return new Response(null, { status: 404 });
  return new Response(landscapeSvg(file === "dark.svg" ? "dark" : "light"), {
    headers: { "Content-Type": "image/svg+xml" },
  });
}
