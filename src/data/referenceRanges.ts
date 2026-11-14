import { validateReferenceCollection } from "../utils/referenceRanges";
export type { ReferenceRange } from "../utils/referenceRanges";

// JSONはビルドに同梱する。公開アプリからの変更やサーバーへの保存は行わない。
const files = import.meta.glob("./reference-ranges/*.json", { eager: true, import: "default" });
export const referenceRanges = validateReferenceCollection(files);
