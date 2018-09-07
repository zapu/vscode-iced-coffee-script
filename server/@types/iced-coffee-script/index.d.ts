/// <reference path="./nodes.d.ts" />
declare module "iced-coffee-script" {
    import { Block } from "iced-coffee-script/lib/coffee-script/nodes"
    export function nodes(source: string, options?: any): Block;
}
