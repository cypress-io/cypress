export const toArray = (val?: string | string[]) => val ? typeof val === 'string' ? [val] : val : []
