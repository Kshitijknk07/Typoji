import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const TAXONOMY_DIR = path.join(ROOT_DIR, "src", "data", "taxonomy");
const OUTPUT_FILE = path.join(ROOT_DIR, "src", "data", "build", "trigger-map.json");

/**
 * @typedef {Object} Trigger
 * @property {string} token
 * @property {string} emoji
 * @property {number} [priority]
 * @property {"low" | "medium" | "high"} [intensity]
 * @property {string[]} [aliases]
 * @property {boolean} [custom]
 * @property {string[]} [additionalTags]
 */

/**
 * @typedef {Object} TaxonomyNode
 * @property {string} id
 * @property {string} label
 * @property {string} [description]
 * @property {Trigger[]} [triggers]
 * @property {TaxonomyNode[]} [children]
 */

/**
 * @param {string} dir
 * @returns {Promise<TaxonomyNode[]>}
 */
async function loadTaxonomy(dir) {
  const files = await readdir(dir);
  const nodes = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const filePath = path.join(dir, file);
    const content = await readFile(filePath, "utf8");
    const parsed = JSON.parse(content);
    nodes.push(parsed);
  }

  return nodes;
}

/**
 * @param {Trigger} trigger
 * @param {string[]} tags
 * @param {string} nodeId
 * @param {Record<string, any>} registry
 * @param {string} [aliasOf]
 */
function registerTrigger(trigger, tags, nodeId, registry, aliasOf) {
  const token = normalizeToken(aliasOf ?? trigger.token);
  if (!token) {
    throw new Error(`Invalid token payload in node ${nodeId}`);
  }

  const entry = {
    emoji: trigger.emoji,
    custom: Boolean(trigger.custom),
    priority: trigger.priority ?? 50,
    intensity: trigger.intensity ?? "medium",
    tags: Array.from(new Set([...tags, ...(trigger.additionalTags ?? [])])),
    sourceNode: nodeId
  };

  if (aliasOf) {
    entry.baseToken = trigger.token;
  }

  const existing = registry[token];
  if (existing && existing.priority >= entry.priority) {
    return;
  }

  registry[token] = entry;
}

/**
 * @param {TaxonomyNode} node
 * @param {string[]} lineage
 * @param {Record<string, any>} registry
 */
function walkNode(node, lineage, registry) {
  const currentTags = [...lineage, node.id];

  if (Array.isArray(node.triggers)) {
    for (const trigger of node.triggers) {
      registerTrigger(trigger, currentTags, node.id, registry);
      if (Array.isArray(trigger.aliases)) {
        for (const alias of trigger.aliases) {
          registerTrigger(
            { ...trigger, token: alias },
            currentTags,
            node.id,
            registry,
            trigger.token
          );
        }
      }
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walkNode(child, currentTags, registry);
    }
  }
}

/**
 * @param {string} value
 */
function normalizeToken(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function main() {
  const taxonomy = await loadTaxonomy(TAXONOMY_DIR);
  const registry = {};

  for (const node of taxonomy) {
    walkNode(node, [], registry);
  }

  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify(registry, null, 2), "utf8");

  console.log(`Trigger map written to ${OUTPUT_FILE}`);
  console.log(`Registered tokens: ${Object.keys(registry).length}`);
}

main().catch((error) => {
  console.error("Failed to build trigger map:", error);
  process.exitCode = 1;
});

