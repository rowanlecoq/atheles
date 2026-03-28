import ActivateForm from "./activate-form";

export const metadata = {
  title: "Activate Account",
};

export default async function ActivatePage({
  params,
}: {
  params: Promise<{ id: string; token: string }>;
}) {
  const { id, token } = await params;

  return <ActivateForm customerId={id} activationToken={token} />;
}
