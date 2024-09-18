import { initialize } from '~/structures/elevenlabs';
import sourcemaps from 'source-map-support';
import '~/structures/server';

sourcemaps.install();
initialize().then(() => import('~/structures/client'));