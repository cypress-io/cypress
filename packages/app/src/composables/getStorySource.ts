import {ref} from 'vue'

export const Status = {
  IDLE: "IDLE",
  LOADING: "LOADING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR"
}

export function useGetStorySource(config: any) {
  const {projectRoot} = config;
  const status = ref(Status.IDLE);
  const newSpecFile = ref();
  const newSpecContent = ref('');
  const newSpecs = ref({})
  function getStorySource(spec: string, absolute: string) {
    status.value = Status.LOADING
    return fetch('/__/createSpecFromStory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spec, absolute, projectRoot }),
    }).then(res => res.json()).then(({file, spec}) => {
      status.value = Status.SUCCESS;
      newSpecFile.value = file;
      newSpecContent.value = spec;
      newSpecs.value = {...newSpecs.value, [file.absolute]: file}
    }).catch(e => {
      status.value = Status.ERROR;
      throw new Error(e)
    })
  }
  (window as any).__CYPRESS_APP_BUS = {getStorySource};

  return {status, newSpecFile, newSpecContent, newSpecs}
}