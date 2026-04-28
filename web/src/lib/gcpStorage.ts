/**
 * ElectraLensAI — GCS / Firebase Storage utility.
 *
 * All Nano Banana Imagen-generated infographics are stored in Firebase Storage
 * (backed by GCS) under the path structure:
 *
 *   images/<concept-slug>/<variant>.png
 *
 * e.g.  images/election-phases/overview.png
 *       images/voter-registration/checklist.png
 *       images/counting-process/flow.png
 *
 * This module provides:
 *   - getImageUrl()     → resolve a download URL for an existing image
 *   - imageExists()     → check if an image already lives in GCS
 *   - uploadImageBlob() → persist a generated Blob (from Imagen API) to GCS
 *   - CONCEPT_IMAGE_MAP → canonical slug-to-path mapping for known infographics
 */

import {
  ref,
  getDownloadURL,
  uploadBytes,
  listAll,
  type StorageReference,
} from 'firebase/storage';
import { storage } from './firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Identifies a canonical infographic in the GCS bucket. */
export type ConceptSlug =
  | 'election-phases'
  | 'voter-registration'
  | 'polling-day'
  | 'counting-process'
  | 'evm-explainer'
  | 'constituency-map'
  | 'ballot-journey'
  | 'mcc-explainer'
  | 'seat-distribution'
  | 'youth-turnout';

export interface GcsImage {
  slug: ConceptSlug;
  path: string;         // GCS object path, e.g. images/election-phases/overview.png
  altText: string;      // Accessible description for screen readers
  imageBrief: string;   // Prompt used to generate via Imagen (for regeneration)
}

// ─── Canonical Image Map ───────────────────────────────────────────────────────
/**
 * Single source of truth for all Nano Banana Imagen-generated assets.
 * If an image does not yet exist in GCS, imagenService will generate and
 * upload it, then populate the download URL here at runtime.
 */
export const CONCEPT_IMAGE_MAP: Record<ConceptSlug, GcsImage> = {
  'election-phases': {
    slug: 'election-phases',
    path: 'images/election-phases/overview.png',
    altText: 'Horizontal infographic showing 5 election phases: Announcement, Registration, Campaign, Polling, Results',
    imageBrief: 'A clean, neutral, civic infographic showing 5 stages of a democratic election lifecycle in a horizontal timeline style. Phases: 1-Announcement, 2-Registration, 3-Campaigning, 4-Polling Day, 5-Results & Certification. Use blue, green, and gold color scheme. Minimal, modern, educational. No party symbols or logos.',
  },
  'voter-registration': {
    slug: 'voter-registration',
    path: 'images/voter-registration/checklist.png',
    altText: 'Step-by-step voter registration checklist infographic with 4 steps',
    imageBrief: 'A clean infographic checklist showing 4 steps to register as a voter: 1-Check eligibility (age 18+), 2-Gather documents (Aadhaar/ID), 3-Submit Form 6 online or at ERO, 4-Verify your name on the electoral roll. Modern flat design, civic blue and white colors. Non-partisan educational style.',
  },
  'polling-day': {
    slug: 'polling-day',
    path: 'images/polling-day/guide.png',
    altText: 'Polling day guide infographic showing booth layout and voting steps',
    imageBrief: 'An educational infographic showing what happens inside a polling booth on election day. Shows the layout: entry queue, identity check, voter slip, EVM machine, VVPAT verification, exit. Neutral civic design, clear icons, no party symbols. Clean modern flat illustration style.',
  },
  'counting-process': {
    slug: 'counting-process',
    path: 'images/counting-process/flow.png',
    altText: 'Flowchart showing the vote counting process from EVM to result declaration',
    imageBrief: 'A flowchart infographic illustrating the vote counting process: EVM transport to counting centre → strongroom to counting table → VVPAT cross-check → round-by-round tally → Returning Officer declaration → result publication. Neutral, civic, educational style. No party colors.',
  },
  'evm-explainer': {
    slug: 'evm-explainer',
    path: 'images/evm-explainer/diagram.png',
    altText: 'Diagram explaining how an EVM and VVPAT machine work together',
    imageBrief: 'An educational diagram showing how an Electronic Voting Machine (EVM) works: Control Unit + Balloting Unit + VVPAT paper trail. Arrows showing the voter pressing a button, the vote recorded in EVM, and a paper slip appearing in VVPAT glass compartment. Clean technical illustration, no party references.',
  },
  'constituency-map': {
    slug: 'constituency-map',
    path: 'images/constituency-map/overview.png',
    altText: 'Stylized map of India showing parliamentary constituency distribution',
    imageBrief: 'A stylized, simplified map of India divided into parliamentary constituencies, color-coded by region (North, South, East, West, Northeast). Educational illustration style. Shows total 543 Lok Sabha seats. No party affiliations or election results shown.',
  },
  'ballot-journey': {
    slug: 'ballot-journey',
    path: 'images/ballot-journey/flow.png',
    altText: 'Journey of a vote from casting to counting shown as a visual flow',
    imageBrief: 'A visual journey infographic showing how a vote travels from the voter to the final result: Voter presses EVM button → vote stored in EVM chip → VVPAT slip printed → EVM sealed → transported to counting centre → counted → result declared. Isometric or flat illustration style, civic blue palette.',
  },
  'mcc-explainer': {
    slug: 'mcc-explainer',
    path: 'images/mcc-explainer/overview.png',
    altText: 'Infographic explaining the Model Code of Conduct (MCC) and its key rules',
    imageBrief: 'An educational infographic explaining the Model Code of Conduct (MCC) for Indian elections. Shows: when it applies (from announcement to results), what is prohibited (new government schemes, use of state resources), who it applies to (all parties and candidates). Clean neutral design, no party symbols.',
  },
  'seat-distribution': {
    slug: 'seat-distribution',
    path: 'images/seat-distribution/donut.png',
    altText: 'Donut chart showing Lok Sabha seat distribution by constituency type',
    imageBrief: 'A clean donut chart infographic showing Lok Sabha seat distribution: 412 General seats (blue), 84 SC Reserved (purple), 47 ST Reserved (green). Total 543 seats. Include a brief label explaining SC = Scheduled Caste, ST = Scheduled Tribe reserved constituencies. Educational, data visualization style.',
  },
  'youth-turnout': {
    slug: 'youth-turnout',
    path: 'images/youth-turnout/chart.png',
    altText: 'Bar chart showing voter turnout trends by age group emphasizing youth participation',
    imageBrief: 'An educational bar chart showing voter turnout by age group in India. Bars for 18-19, 20-29, 30-39, 40-49, 50-59, 60+ age groups. Highlight the 18-19 bar to show the importance of first-time voters. Include a callout: "Your first vote matters — youth turnout shapes election outcomes." Civic, motivational, non-partisan style.',
  },
};

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Resolves a Firebase Storage download URL for a known concept image.
 * Returns `null` if the image does not yet exist in GCS.
 */
export async function getImageUrl(slug: ConceptSlug): Promise<string | null> {
  try {
    const imageRef: StorageReference = ref(storage, CONCEPT_IMAGE_MAP[slug].path);
    const url = await getDownloadURL(imageRef);
    return url;
  } catch {
    // StorageError code 'storage/object-not-found' — image not yet generated
    return null;
  }
}

/**
 * Checks whether an image already exists in GCS by listing the parent folder.
 * More efficient than a failed getDownloadURL for preflight checks.
 */
export async function imageExists(slug: ConceptSlug): Promise<boolean> {
  try {
    const { path } = CONCEPT_IMAGE_MAP[slug];
    const folder = path.substring(0, path.lastIndexOf('/'));
    const folderRef = ref(storage, folder);
    const list = await listAll(folderRef);
    const filename = path.split('/').pop() ?? '';
    return list.items.some((item) => item.name === filename);
  } catch {
    return false;
  }
}

/**
 * Uploads a Blob (from the Imagen API response) to the GCS bucket.
 * Called by `imagenService.generateAndStore()` after image generation.
 *
 * @param slug     - Canonical concept slug identifying the infographic type
 * @param blob     - The raw PNG image blob from Imagen
 * @returns        Download URL of the uploaded image
 */
export async function uploadImageBlob(slug: ConceptSlug, blob: Blob): Promise<string> {
  const { path } = CONCEPT_IMAGE_MAP[slug];
  const imageRef = ref(storage, path);
  const snapshot = await uploadBytes(imageRef, blob, {
    contentType: 'image/png',
    customMetadata: {
      generatedBy: 'nano-banana-imagen',
      concept: slug,
      generatedAt: new Date().toISOString(),
    },
  });
  return await getDownloadURL(snapshot.ref);
}
