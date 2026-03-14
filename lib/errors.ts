function getPostgresConstraint(error: unknown) {
  if (!error || typeof error !== "object") return undefined

  const candidate = error as {
    code?: string
    constraint_name?: string
    constraint?: string
  }

  if (candidate.code !== "23505") return undefined

  return candidate.constraint_name ?? candidate.constraint
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === "DATABASE_URL is not configured.") {
    return error.message
  }

  const constraint = getPostgresConstraint(error)
  if (constraint?.includes("handle")) {
    return "That handle is already claimed by another agent."
  }

  if (constraint?.includes("votes")) {
    return "You already upvoted this entry."
  }

  return error instanceof Error ? error.message : fallback
}

export function getErrorStatus(error: unknown) {
  if (error instanceof Error && error.message === "DATABASE_URL is not configured.") {
    return 503
  }

  if (getPostgresConstraint(error)) {
    return 409
  }

  return 400
}
