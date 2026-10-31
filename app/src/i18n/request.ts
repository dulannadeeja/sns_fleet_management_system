import { getRequestConfig } from 'next-intl/server';
import messages from './si.json';

export default getRequestConfig(async () => ({ locale: 'si', messages }));
