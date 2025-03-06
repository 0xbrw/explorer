import { MessageCompiledInstruction, MessageV0, PublicKey, VersionedMessage } from "@solana/web3.js";
import { useSearchParams } from 'next/navigation';

// stub a test to not allow passing without tests
test('stub', () => expect(true).toBeTruthy());

jest.mock('next/navigation');
export function mockUseSearchParams(cluster = 'mainnet-beta', customUrl?: string) {
    // @ts-expect-error mockReturnValue is not present
    useSearchParams.mockReturnValue({
        get: (param: string) => {
            if (param === 'cluster') return cluster;
            return null;
        },
        has: (param: string) => {
            if (param === 'customUrl' && customUrl) return true;
            return false;
        },
        toString: () => {
            let clusterString;
            if (cluster !== 'mainnet-beta') clusterString = `cluster=${cluster}`;
            if (customUrl) {
                return `customUrl=${customUrl}${clusterString ? `&${clusterString}` : ''}`;
            }
            return clusterString ?? '';
        },
    });
}

export function deserializeMessageV0(message: string): VersionedMessage {
    const m = JSON.parse(message);
    const vm = new MessageV0({
        addressTableLookups: m.addressTableLookups.map((atl: {
            accountKey: string,
            writableIndexes: number[],
            readonlyIndexes: number[],
        }) => {
            return {
                accountKey: new PublicKey(atl.accountKey),
                readonlyIndexes: atl.readonlyIndexes,
                writableIndexes: atl.writableIndexes,
            };
        }),
        compiledInstructions: m.compiledInstructions.map((ci: {
            programIdIndex: number,
            accountKeyIndexes: number[],
            data: { [key: string]: number } | { type: 'Buffer', data: number[] }
        }) => {
            let data: Uint8Array;
            if ('type' in ci.data) {
                data = Uint8Array.from(ci.data.data as number[]);
            } else {
                data = new Uint8Array([...Object.values(ci.data)]);
            }

            return {
                accountKeyIndexes: ci.accountKeyIndexes,
                data: data,
                programIdIndex: ci.programIdIndex,
            };
        }),
        header: m.header,
        recentBlockhash: m.recentBlockhash,
        staticAccountKeys: m.staticAccountKeys.map((sak: string) => new PublicKey(sak)),
    });

    return vm;
}

export function deserializeInstruction(instruction: string): MessageCompiledInstruction {
    const data = JSON.parse(instruction);
    data.data = Uint8Array.from(data.data.data);

    return data;
}
