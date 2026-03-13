# Session 36: Pilot Controls and Tenant Readiness

**Date:** 2026-03-13
**Status:** Draft
**Supersedes:** Session 35

## Context

This session continues the Wave 7 work on delivery ledger and idempotent execution, and prepares the system for the-level pilot deployment.

 Specifically, this session introduces:

## 1. Pilot Controls

- Tenant selector (workspace)
- Tenant-aware data isolation
- Role-based access control

- Tenant-specific configuration

## 2. Tenant Readiness

- Environment variable validation
- Database connection pooling
- Error handling for graceful degradation

- Migration compatibility checks

- Tenant provisioning audit logging

## 3. Implementation Notes

- All tenant-specific code should use the `TenantContext` from `@/contexts/tenant`
- Database queries must filter by `tenantId` from `WHERE` clauses
- All API routes should validate tenant access
- New environment variable: `DEFAULT_TENANT_ID` for development

## 4. Database Schema

```prisma
model Tenant {
  id                String   @id
  name              String
  slug              String   @unique
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  settings           Json?
  isActive          Boolean  @default(true)
}

```

## 5. API Routes

- `GET /api/tenants` - List all tenants
- `POST /api/tenants` - Create new tenant
- `GET /api/tenants/[id]` - Get tenant by ID
- `PUT /api/tenants/[id]` - Update tenant
- `DELETE /api/tenants/[id]` - Delete tenant
- `GET /api/tenants/[id]/status` - Health check
- `POST /api/tenants/validate` - Validate tenant config

## 6. File Changes
- `prisma/schema.prisma` - Add Tenant model
- `contexts/tenant-context.tsx` - New file
- `app/api/tenants/route.ts` - New file
- `app/api/tenants/[id]/route.ts` - New file
- `app/api/tenants/[id]/status/route.ts` - New file
- `app/api/tenants/validate/route.ts` - New file
- `lib/tenant-utils.ts` - New file
- `lib/__tests__/tenant-utils.test.ts` - Unit tests

## 7. Testing
- Unit tests for tenant utilities
- Integration tests for tenant API routes
- E2E tests for tenant creation flow
- Performance tests for tenant isolation

## 8. Documentation
- Update README.md with multi-tenant section
- Add tenant-specific API documentation
- Update ARCHITECTURE.md with tenant context
- Create deployment guide for tenant setup

## 9. Success Criteria
- [ ] All tests pass
- [ ] Tenant creation flow works
- [ ] Tenant isolation works
- [ ] Tenant switching works
- [ ] Error handling works
- [ ] Documentation complete
- [ ] Code review approved

