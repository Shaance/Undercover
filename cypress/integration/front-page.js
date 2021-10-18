/// <reference types="cypress" />

describe('Undercover front page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5000')
  })

  it('loads the page text elements', () => {
    cy.get('h1').should('have.text', 'Undercover')
    cy.get('h2').first().should('have.text', 'Choose your name')
    cy.get('h2').last().should('have.text', 'Join room with code')
    cy.get('h3').should('have.text', 'Or')
  })


  it('loads the buttons and text', () => {
    cy.get('#create-room-btn').should('have.text', 'Create room')
    cy.get('#join-room-btn').should('have.text', 'Join')
  })

  it('Should get toast for with error for empty name when clicking on create room with empty name', () => {
    cy.get('#create-room-btn')
      .click()
      .then(() => {
        cy.get('.toast-wrapper').children().contains('Cannot have empty name')
      })
  })

  it('Should get toast for with error for empty name when clicking on join room with empty name', () => {
    cy.get('#join-room-btn')
      .click()
      .then(() => {
        cy.get('.toast-wrapper').children().contains('Cannot have empty name')
      })
  })

  it('Should get toast for with error for empty room id when clicking on join room with filled name and empty room id', () => {
    cy.get('#name').type('Toto')
    cy.get('#join-room-btn')
      .click()
      .then(() => {
        cy.get('.toast-wrapper').children().contains('Room IDs should be of length 5')
      })
  })

  it('Should get toast for with error for non bad room id length when clicking on join room with filled name and bad room id length', () => {
    cy.get('#name').type('Toto')
    cy.get('#room-id').type('Toto')
    cy.get('#join-room-btn')
      .click()
      .then(() => {
        cy.get('.toast-wrapper').children().contains('Room IDs should be of length 5')
      })
  })

  it('Should get toast for with error for non existing room id when clicking on join room with filled name and unknown room id', () => {
    cy.get('#name').type('Toto')
    cy.get('#room-id').type('Toto3')
    cy.get('#join-room-btn')
      .click()
      .then(() => {
        cy.get('.toast-wrapper').children().contains('This room id does not exist!')
      })
  })

  it('Should get to lobby page when filled name then clicking on create room', () => {
    cy.get('#name').type('Toto')
    cy.get('#create-room-btn')
      .click()
      .then(() => {
        cy.get('#settings-title').contains('Settings')
      })
  })

  // context('Created a room', () => {
  //   before(() => {
  //     let roomId;
  //     cy.get('#name').type('Toto')
  //     cy.get('#create-room-btn')
  //       .click()
  //       .then(() => {
  //         roomId = Cypress.$('#room-id').text.split(':')[1].trim()
  //         cy.log(roomId)
  //         // cy.get('#room-id').children().
  //       })
  //   })
  // })
})
