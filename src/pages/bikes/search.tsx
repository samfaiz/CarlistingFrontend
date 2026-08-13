/**
 * /bikes/search — legacy mockup route. The live bikes vertical (P6-01) is the
 * /bikes hub itself; this preserves old links by redirecting with the query.
 */
import type { GetServerSideProps } from "next";

export default function BikesSearchRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const qs = new URLSearchParams(
    Object.entries(query).filter(([, v]) => typeof v === "string") as [string, string][],
  ).toString();
  return {
    redirect: { destination: `/bikes${qs ? `?${qs}` : ""}`, permanent: true },
  };
};
