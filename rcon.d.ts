/// <reference types="node" />
export declare class RconError extends Error {
	constructor(message: string);
}

declare class Rcon {

	constructor(host: string, password: string, timeout?: number);
	constructor(host: string, port: number, password: string, timeout?: number);

	host: string;
	port: number;
	password: string;
	timeout: number;

	connect(): Promise<void>;

	disconnect(): Promise<void>;

	send(data: string): Promise<string>;
}

exports = Rcon;
