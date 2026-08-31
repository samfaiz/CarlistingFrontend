/**
 * Car-scoped cascade lookup for the /cars filters.
 *
 * `getModels()` in `lib/marketplace-api.ts` calls
 * `GET /taxonomy/makes/:id/models` without the endpoint's optional
 * `vehicleType` query, so a make that sells both — BMW in the seeded set —
 * returns its motorcycles alongside its cars and the car search offers
 * "G 310 R" as a model. The route already supports the filter; this is the
 * same call with the scope the car search needs.
 *
 * Trims need no equivalent: a trim hangs off a model that is already scoped.
 */
import { apiGet } from "@/lib/api";
import type { TaxonomyModel } from "@/lib/marketplace-api";

export function getCarModels(makeId: string): Promise<TaxonomyModel[]> {
  return apiGet<TaxonomyModel[]>(
    `/taxonomy/makes/${encodeURIComponent(makeId)}/models?vehicleType=CAR`,
  );
}
