import { colorize } from '~/utilities';
import { inspect } from 'node:util';
import config from '~/config';

export function log(...args: string[]): void {
	return console.log('»', ...args);
}

export function error(...args: string[]): void {
	return console.info('»', ...args.map(arg => colorize(typeof arg === 'string' ? arg : inspect(arg), 'red')));
}

export function success(...args: string[]): void {
	return console.info('»', ...args.map(arg => colorize(typeof arg === 'string' ? arg : inspect(arg), 'green')));
}

export function warn(...args: string[]): void {
	return console.info('»', ...args.map(arg => colorize(typeof arg === 'string' ? arg : inspect(arg), 'yellow')));
}

export function debug(...args: string[]): void {
	if (!config.debug) return;
	return console.info('»', ...args.map(arg => colorize(typeof arg === 'string' ? arg : inspect(arg), 'gray')));
}

export function info(...args: string[]): void {
	return console.info('»', ...args.map(arg => colorize(typeof arg === 'string' ? arg : inspect(arg), 'cyan')));
}

export function createLogger(...callers: string[]) {
	const prefix = '[' + callers.join(' → ') + ']';

	return {
		log: (...args) => log(prefix, ...args),
		error: (...args) => error(prefix, ...args),
		success: (...args) => success(prefix, ...args),
		warn: (...args) => warn(prefix, ...args),
		debug: (...args) => debug(prefix, ...args),
		info: (...args) => info(prefix, ...args),
	};
}