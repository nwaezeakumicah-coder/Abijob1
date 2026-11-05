"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteAdministrator } from "./actions";

export default function InviteAdminForm() {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setMessage("");

    startTransition(async () => {
      const result = await inviteAdministrator(formData);

      setSuccess(result.success);
      setMessage(result.message);

      if (result.success) {
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <section className="admin-invite-section">
      <div className="admin-invite-heading">
        <div>
          <span className="admin-accounts-eyebrow">
            TEAM ACCESS
          </span>
          <h2>Add an administrator</h2>
          <p>
            Invite a trusted person to help manage the Abi Job platform.
          </p>
        </div>
      </div>

      <form className="admin-invite-form" onSubmit={handleSubmit}>
        <div className="admin-invite-field">
          <label htmlFor="admin-invite-email">
            Administrator email address
          </label>

          <input
            id="admin-invite-email"
            name="email"
            type="email"
            placeholder="example@email.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="admin-invite-field">
          <label htmlFor="admin-invite-role">
            Assign administrator role
          </label>

          <select
            id="admin-invite-role"
            name="role"
            defaultValue="moderator"
            required
          >
            <option value="moderator">Moderator</option>
            <option value="support_staff">Support Staff</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <button
          type="submit"
          className="admin-invite-button"
          disabled={isPending}
        >
          {isPending ? "Sending invitation..." : "Send invitation"}
        </button>
      </form>

      {message && (
        <div
          className={`admin-invite-message ${
            success ? "success" : "error"
          }`}
          role="status"
        >
          {message}
        </div>
      )}

      <p className="admin-invite-note">
        The invited person will receive an email from Supabase. Their
        administrator record will remain pending until you activate it.
      </p>
    </section>
  );
}