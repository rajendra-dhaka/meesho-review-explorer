export function Pagination({ onPageChange, pagination }) {
  if (pagination.total <= pagination.pageSize) return null;

  return (
    <div className="mre-pagination">
      <span>
        Showing {pagination.from}-{pagination.to} of {pagination.total}
      </span>
      <div>
        <button disabled={pagination.page <= 1} onClick={() => onPageChange(1)}>
          First
        </button>
        <button disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
          Previous
        </button>
        <strong>
          {pagination.page} / {pagination.totalPages}
        </strong>
        <button
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
