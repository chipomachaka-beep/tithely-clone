"use client";

// The form on the Edit pages. It has a Save button and a Delete button; both
// ask "Are you sure?" and need a short reason first. Save sends the form to
// `saveAction`; Delete sends it to `deleteAction`.
export default function EditForm({ saveAction, deleteAction, what, children }) {
  function confirmChange(event) {
    const form = event.currentTarget;
    const isDelete = event.nativeEvent.submitter?.dataset.intent === "delete";
    const reason = form.reason.value.trim();

    if (reason.length < 3) {
      event.preventDefault();
      form.reason.focus();
      form.reason.setCustomValidity("Please give a short reason, like “wrong amount”.");
      form.reason.reportValidity();
      return;
    }

    const question =
      isDelete
        ? `Are you sure you want to delete ${what}? This can't be undone.\n\nReason: ${reason}`
        : `Are you sure you want to save these changes to ${what}?\n\nReason: ${reason}`;
    if (!window.confirm(question)) {
      event.preventDefault();
    }
  }

  return (
    <form
      action={saveAction}
      onSubmit={confirmChange}
      onInput={(event) => event.target.setCustomValidity?.("")}
      className="form"
    >
      {children}

      <label className="reason-field">
        Reason for this change
        <input
          name="reason"
          type="text"
          required
          minLength={3}
          maxLength={200}
          placeholder="e.g. wrong amount"
        />
      </label>

      <div className="edit-buttons">
        <button type="submit" data-intent="save" className="button button-gold">
          Save
        </button>
        <button
          type="submit"
          data-intent="delete"
          formAction={deleteAction}
          formNoValidate
          className="button button-danger"
        >
          Delete
        </button>
      </div>
    </form>
  );
}
