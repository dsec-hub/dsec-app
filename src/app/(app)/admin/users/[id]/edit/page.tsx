import { notFound } from "next/navigation";

import { PageHeader } from "@/components/ui";
import { getRoleOptions, getUserById } from "@/lib/admin-queries";
import { getCurrentUser } from "@/lib/dal";

import { updateUser } from "../../actions";
import { UserForm } from "../../user-form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = Number(id);
  if (Number.isNaN(userId)) notFound();

  const [user, roles, me] = await Promise.all([
    getUserById(userId),
    getRoleOptions(),
    getCurrentUser(),
  ]);
  if (!user) notFound();

  return (
    <>
      <PageHeader title="Edit user" description={user.email} />
      <UserForm
        action={updateUser.bind(null, userId)}
        user={user}
        roles={roles}
        isSelf={me?.id === userId}
        redirectOnSuccess="/admin/users"
      />
    </>
  );
}
