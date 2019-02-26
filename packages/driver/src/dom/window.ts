import $jquery from './jquery'
import $document from './document'

interface IEDoc extends Document {
  parentWindow: Window
}

export const getWindowByElement = function (el: Window | HTMLElement): Window {
  if (isNativeWindow(el)) {
    return el
  }

  const doc = $document.getDocumentFromElement(el)

  return getWindowByDocument(doc)
}

export const getWindowByDocument = (doc: Document | IEDoc): Window => {
  // parentWindow for IE
  return doc.defaultView || (doc as IEDoc).parentWindow
}

const isNativeWindow = (obj: any): obj is Window => {
  return Boolean(obj && obj.window === obj)
}

export const isWindow = function (obj: any): obj is Window | JQuery<Window> {
  try {
    if ($jquery.isJquery(obj)) {
      obj = obj[0]
    }

    return isNativeWindow(obj)
  } catch (error) {
    return false
  }
}
