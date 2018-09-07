declare module "iced-coffee-script/lib/coffee-script/nodes" {
    export abstract class Base {
        contains(pred: Base): true | undefined;
        
        locationData : LocationData;
    }

    export class LocationData {
        first_line: number;
        first_column: number;
        last_line: number;
        last_column: number;
    }

    export class Block extends Base {
        expressions: Base[];
    }

    export class Code extends Base {
        params: Param[];
    }

    export class Param extends Base {
        name: Literal;
    }

    export class Literal extends Base {
        value: string;
    }

    export class Assign extends Base {
        variable : Base;
        value : Base;
    }

    export class Call extends Base {
        isSuper : boolean;
    }

    export class Value extends Base {
        base : Base;
        properties : any[];
    }

    export class Access extends Base {
        name : Base;
    }

    export class Class extends Base {
        variable : Base;
    }
}
