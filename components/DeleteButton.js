"use client";

// A small red "Delete" button that asks "Are you sure?" first.
// It sends the row's id to the server action passed in as `action`.
export default function DeleteButton({ action, id, what }) {
  function confirmDelete(event) {
    if (!window.confirm(`Are you sure you want to delete ${what}? This can't be undone.`)) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={confirmDelete} className="delete-form">
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="delete-button">
        Delete
      </button>
    </form>
  );
}
