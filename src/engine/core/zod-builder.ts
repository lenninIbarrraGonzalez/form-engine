// IMPORTANT: This file MUST NOT import from react, react-hook-form, or any store module.
// It is a pure core module that only depends on zod and the schema types.
import { z } from 'zod'
import type { FieldDefinition, FormDefinition } from '../schema/types'
import type { VisibilityMap } from './condition-evaluator'

// ---- Internal helpers -----------------------------------------------

/**
 * Builds a Zod validator for a single visible field definition.
 * Returns null for unknown/unsupported types (caller skips those).
 */
export function buildZodField(field: FieldDefinition): z.ZodTypeAny {
  const { type, validations: v = {} } = field

  switch (type) {
    case 'text':
    case 'tel': {
      let schema = z.string()
      if (v.required) schema = schema.min(1)
      if (v.minLength !== undefined) schema = schema.min(v.minLength)
      if (v.maxLength !== undefined) schema = schema.max(v.maxLength)
      if (v.pattern) schema = schema.regex(new RegExp(v.pattern))
      return v.optional ? schema.optional() : schema
    }

    case 'number': {
      let schema = z.number()
      if (v.min !== undefined) schema = schema.min(v.min)
      if (v.max !== undefined) schema = schema.max(v.max)
      return v.optional ? schema.optional() : schema
    }

    case 'select': {
      const base = z.string()
      return v.optional ? base.optional() : base
    }

    case 'checkbox':
      return z.boolean().optional()

    case 'file':
      return z.unknown().optional()

    case 'array': {
      let schema = z.array(z.unknown())
      if (v.minItems !== undefined) schema = schema.min(v.minItems)
      if (v.maxItems !== undefined) schema = schema.max(v.maxItems)
      return v.optional ? schema.optional() : schema
    }

    case 'group':
      // Groups are structural — validation lives on their child fields
      return z.record(z.unknown()).optional()

    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

/**
 * Builds a z.object() from a list of field definitions and a VisibilityMap.
 * Fields where visibility[field.name] === false are excluded entirely.
 * Fields absent from the map are treated as visible (undefined !== false).
 */
export function buildZodObject(
  fields: FieldDefinition[],
  visibility: VisibilityMap,
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    // Exclude hidden fields; absent from map → visible by default
    if (visibility[field.name] === false) continue
    shape[field.name] = buildZodField(field)
  }

  return z.object(shape)
}

/**
 * Builds the full Zod validation schema for a FormDefinition
 * respecting the current VisibilityMap.
 *
 * Hidden fields (visibility[name] === false) are excluded from the schema —
 * they will NOT be validated on form submit.
 *
 * Pure function — no React, no RHF, no store imports.
 */
export function buildZodSchema(
  definition: FormDefinition,
  visibility: VisibilityMap,
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const allFields = [
    ...(definition.fields ?? []),
    ...(definition.steps?.flatMap((s) => s.fields) ?? []),
  ]

  return buildZodObject(allFields, visibility)
}
