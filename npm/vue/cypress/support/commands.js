/// <reference types="cypress" />
import { mount } from '@cypress/vue'

Cypress.Commands.add('mount', (comp) => {
  return mount(comp)
})

import 'cypress-xpath';

Cypress.SelectorPlayground.defaults({
    onElement: ($el) => {
        const element = $el[0];
        
        
        if (element.id) {
            return `//*[@id="${element.id}"]`;
        }
        
        
        if (element.name) {
            return `//*[@name="${element.name}"]`;
        }

        
        const text = element.textContent?.trim();
        if (text && !element.children.length) {
            return `//*[text()="${text}"]`;
        }

        
        const classes = Array.from(element.classList);
        if (classes.length) {
            const uniqueClass = classes.find(className => 
                document.getElementsByClassName(className).length === 1
            );
            if (uniqueClass) {
                return `//*[contains(@class, "${uniqueClass}")]`;
            }
        }

        
        const tagName = element.tagName.toLowerCase();
        const attributes = element.attributes;
        for (let attr of attributes) {
            if (attr.name !== 'class' && attr.name !== 'style') {
                return `//${tagName}[@${attr.name}="${attr.value}"]`;
            }
        }

        
        let path = '';
        let parent = element;
        while (parent && parent.nodeType === 1) {
            let index = 1;
            let sibling = parent.previousSibling;
            while (sibling) {
                if (sibling.nodeType === 1 && sibling.tagName === parent.tagName) {
                    index++;
                }
                sibling = sibling.previousSibling;
            }
            const pathIndex = (index > 1 ? `[${index}]` : '');
            path = `/${parent.tagName.toLowerCase()}${pathIndex}${path}`;
            parent = parent.parentNode;
        }
        return `//${tagName}[${getElementIndex(element) + 1}]${getUniquePredicates(element)}`;
    }
});


function getElementIndex(element) {
    let index = 0;
    let prev = element;
    while (prev = prev.previousElementSibling) {
        if (prev.tagName === element.tagName) {
            index++;
        }
    }
    return index;
}


function getUniquePredicates(element) {
    const predicates = [];
    
    
    const classes = Array.from(element.classList);
    if (classes.length) {
        predicates.push(`contains(@class, "${classes[0]}")`);
    }

    
    const text = element.textContent?.trim();
    if (text && text.length > 0) {
        predicates.push(`contains(text(), "${text.substring(0, 20)}")`);
    }

    return predicates.length ? '[' + predicates.join(' and ') + ']' : '';
}


Cypress.Commands.add('xpath', (selector, options) => {
    return cy.xpath(selector, options);
});
