import { getSourceVisitor, parseAST } from 'sonic-weave/parser'
import { TextImporter, type ImportResult } from '@/importers/base'
import { RootContext } from 'sonic-weave/context'

/**
 * Importer for the SonicWeave interchange format (`.swi`).
 *
 * Specs: https://github.com/xenharmonic-devs/sonic-weave/blob/main/documentation/interchange.md
 */
export class SonicWeaveInterchangeImporter extends TextImporter {
  parseText(input: string): ImportResult {
    const ast = parseAST(input)
    const visitor = getSourceVisitor(false)
    visitor.executeProgram(ast)
    for (const interval of visitor.currentScale) {
      // Strip interchange format
      interval.node = undefined
      if (interval.isRelative() && interval.value.isFractional()) {
        interval.domain = 'linear'
      }
    }
    const result = {
      name: visitor.rootContext?.title,
      sourceText: visitor.expand(new RootContext())
    }
    return result
  }
}
