
export function extractApiData(response) {
  const body = response?.data;
  if (body === null || body === undefined) return body;
  if (Array.isArray(body)) return body;
  if (body.data !== undefined && body.data !== null) {
    if (typeof body.data === "object" && body.data.data !== undefined) {
      return body.data.data;
    }
    return body.data;
  }
  return body;
}

export function extractApiError(error, fallback = "Something went wrong") {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === "string") return data;
  return (
    data.message ||
    data.error?.message ||
    data.error ||
    (Array.isArray(data.errors) ? data.errors.join(", ") : null) ||
    fallback
  );
}

export function buildSalesReportPayload(filters = {}) {
  const payload = {};
  if (filters.startDate) {
    payload.startDate = filters.startDate.includes("T")
      ? filters.startDate
      : `${filters.startDate}T00:00:00.000Z`;
  }
  if (filters.endDate) {
    payload.endDate = filters.endDate.includes("T")
      ? filters.endDate
      : `${filters.endDate}T23:59:59.999Z`;
  }
  if (filters.limit !== undefined && filters.limit !== "") {
    payload.limit = Number(filters.limit);
  }
  if (filters.sortBy) payload.sortBy = filters.sortBy;
  return payload;
}
