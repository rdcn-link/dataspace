import {scientificApplication} from '../downloaded-runtime.mjs';
export const serviceId="svc-003";
const application=scientificApplication(serviceId);
export const registryAdapter=application.registryAdapter;
export const validation=application.validation;
