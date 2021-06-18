export enum CurveType {
    BN254 = 0,
    BN_SNARK1 = 4,
    BLS12_381 = 5,

    SECP224K1 = 101,
    SECP256K1 = 102,
    NIST_P192 = 105,
    NIST_P224 = 106,
    NIST_P256 = 107,
}

export const BN254 = CurveType.BN254;
export const BN_SNARK1 = CurveType.BN_SNARK1;
export const BLS12_381 = CurveType.BLS12_381;
export const SECP224K1 = CurveType.SECP224K1;
export const SECP56K1 = CurveType.SECP256K1;
export const NISTP192 = CurveType.NISTP192;
export const NISTP224 = CurveType.NISTP224;
export const NISTP256 = CurveType.NIST256;

export function init(curveType?: CurveType): Promise<void>;

declare class Common {
    deserializeHexStr(s: string): void;
    serializeToHexStr(): string;
    dump(msg?: string): void;
    clear(): void;
    clone(): this;
    setStr(s: string, base?: number): void;
    getStr(base?: number): string;
    isEqual(rhs: this): boolean
    isZero(): boolean;
    deserialize(v: Uint8Array): void;
    serialize(): Uint8Array;
}

declare class IntType extends Common {
    setInt(x: number): void;
    isOne(): boolean;
    setLittleEndian(a: Uint8Array): void;
    setLittleEndianMod(a: Uint8Array): void;
    setBigEndianMod(a: Uint8Array): void;
    setByCSPRNG(): void;
    setHashOf(a: Uint8Array): void;
}

declare class Fr extends IntType {
}

declare class Fp extends IntType {
    mapToG1(): G1;
}

declare class Fp2 extends Common {
    setInt(x:number, y:number):void;
    get_a(): Fp;
    get_b(): Fp;
    set_a(v: Fp):void;
    set_b(v: Fp):void;
    mapToG2(): WebGL2RenderingContext;
}

declare class EllipticType extends Common{ 

}

export function deserializeHexStrToFr(s: string): Fr;
export function deserializeHexStrToFp(s: string): Fp;
export function deserializeHexStrToFp2(s: string): Fp2;
