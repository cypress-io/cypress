import {ref} from 'vue'

export const Status = {
  IDLE: "IDLE",
  LOADING: "LOADING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR"
}

export function useGetStorySource() {
  const status = ref(Status.IDLE);
  const specTxt = ref('');
  const specPath = ref('');
  function getStorySource(spec: string, absolute: string) {
    status.value = Status.LOADING
    return fetch('/__/createSpecFromStory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spec, absolute }),
    }).then(res => res.json()).then(({spec, absolute}) => {
      status.value = Status.SUCCESS;
      specTxt.value = spec;
      specPath.value = absolute;
    }).catch(e => {
      status.value = Status.ERROR;
      throw new Error(e)
    })
  }
  (window as any).__CYPRESS_APP_BUS = {getStorySource};

  return {status, specTxt, specPath}
}