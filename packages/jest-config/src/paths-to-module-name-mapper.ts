import type { Config } from '@jest/types';
import type { CompilerOptions } from 'typescript';

type ITsPathMapping = Exclude<CompilerOptions['paths'], undefined>;
type IJestPathMapping = Config.InitialOptions['moduleNameMapper'];

const escapeRegex = (str: string) => str.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');

export const pathsToModuleNameMapper = (
    mapping: ITsPathMapping,
    { prefix = '', useESM = false }: { prefix?: string; useESM?: boolean } = {},
): IJestPathMapping => {
    const jestMap: IJestPathMapping = {};
    for (const fromPath of Object.keys(mapping)) {
        const toPaths = mapping[fromPath]!;
        if (toPaths.length === 0) continue;
        const segments = fromPath.split(/\*/g);
        if (segments.length === 1) {
            const paths = toPaths.map((target) => {
                const enrichedPrefix =
                    prefix !== '' && !prefix.endsWith('/') ? `${prefix}/` : prefix;

                return `${enrichedPrefix}${target}`;
            });
            const cjsPattern = `^${escapeRegex(fromPath)}$`;
            jestMap[cjsPattern] = paths.length === 1 ? paths[0]! : paths;
        } else if (segments.length === 2) {
            const paths = toPaths.map((target) => {
                const enrichedTarget =
                    target.startsWith('./') && prefix !== ''
                        ? target.substring(target.indexOf('/') + 1)
                        : target;
                const enrichedPrefix =
                    prefix !== '' && !prefix.endsWith('/') ? `${prefix}/` : prefix;

                return `${enrichedPrefix}${enrichedTarget.replace(/\*/g, '$1')}`;
            });
            if (useESM) {
                const esmPattern = `^${escapeRegex(segments[0]!)}(.*)${escapeRegex(segments[1]!)}\\.js$`;
                jestMap[esmPattern] = paths.length === 1 ? paths[0]! : paths;
            }
            const cjsPattern = `^${escapeRegex(segments[0]!)}(.*)${escapeRegex(segments[1]!)}$`;
            jestMap[cjsPattern] = paths.length === 1 ? paths[0]! : paths;
        }
    }

    if (useESM) jestMap['^(\\.{1,2}/.*)\\.js$'] = '$1';

    return jestMap;
};
