
import RoleRegistrationForm from "./RoleRegistrationForm";

export const instant = false;

type PageProps = {
  params: Promise<{ role: string }>;
};

export default async function RoleRegistrationPage({
  params,
}: PageProps) {
  const { role } = await params;

  return <RoleRegistrationForm roleKey={role} />;
}
