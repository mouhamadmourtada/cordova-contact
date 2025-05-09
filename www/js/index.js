/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

let currentContact = null;

function onDeviceReady() {
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    
    // Initialiser l'application
    loadContacts();

    // Gestionnaires d'événements pour les formulaires
    $('#contactAdd form').on('submit', handleAddContact);
    $('#contactEdit form').on('submit', handleEditContact);
    $('#deleteConfirm .ui-btn-b:last').on('click', handleDeleteContact);

    // Gestionnaire pour le changement de photo
    $('.ui-icon-camera').on('click', handleChangePhoto);
}

// Charger tous les contacts
function loadContacts() {
    const options = new ContactFindOptions();
    options.multiple = true;

    const fields = ['displayName', 'name', 'phoneNumbers', 'emails', 'addresses', 'photos', 'categories'];
    
    navigator.contacts.find(fields, onContactsSuccess, onContactsError, options);
}

// Succès du chargement des contacts
function onContactsSuccess(contacts) {
    const contactList = $('#contactList');
    contactList.empty();

    contacts.forEach(contact => {
        const name = contact.displayName || (contact.name ? contact.name.formatted : 'Sans nom');
        const phone = contact.phoneNumbers && contact.phoneNumbers.length > 0 
            ? contact.phoneNumbers[0].value : '';
        const category = contact.categories && contact.categories.length > 0 
            ? contact.categories[0] : 'Personnel';
        
        const photoUrl = contact.photos && contact.photos.length > 0 
            ? contact.photos[0].value : 'img/av.png';

        const li = $(`
            <li class="contact-list-item">
                <a href="#contactView" data-transition="slide">
                    <img src="${photoUrl}" alt="Contact">
                    <h2>${name}</h2>
                    <p><i class="ui-icon-phone"></i> ${phone}</p>
                    <p class="ui-li-aside">${category}</p>
                </a>
            </li>
        `);

        li.find('a').on('click', () => viewContact(contact));
        contactList.append(li);
    });

    contactList.listview('refresh');
}

// Erreur du chargement des contacts
function onContactsError(error) {
    console.error('Erreur lors du chargement des contacts:', error);
    alert('Impossible de charger les contacts: ' + error);
}

// Afficher un contact
function viewContact(contact) {
    currentContact = contact;
    
    const name = contact.displayName || (contact.name ? contact.name.formatted : 'Sans nom');
    const phone = contact.phoneNumbers && contact.phoneNumbers.length > 0 
        ? contact.phoneNumbers[0].value : '';
    const email = contact.emails && contact.emails.length > 0 
        ? contact.emails[0].value : '';
    const address = contact.addresses && contact.addresses.length > 0 
        ? contact.addresses[0].formatted : '';
    const category = contact.categories && contact.categories.length > 0 
        ? contact.categories[0] : 'Personnel';
    const photoUrl = contact.photos && contact.photos.length > 0 
        ? contact.photos[0].value : 'img/av.png';

    // Mettre à jour la vue détaillée
    $('#contactView h2').text(name);
    $('#contactView img').attr('src', photoUrl);
    $('#contactView .ui-listview li:eq(0) p a').text(phone).attr('href', 'tel:' + phone);
    $('#contactView .ui-listview li:eq(1) p a').text(email).attr('href', 'mailto:' + email);
    $('#contactView .ui-listview li:eq(2) p').text(address);
    $('#contactView .ui-listview li:eq(3) p').text(category);

    // Préremplir le formulaire d'édition
    $('#editName').val(name);
    $('#editPhone').val(phone);
    $('#editEmail').val(email);
    $('#editAddress').val(address);
    $('#editGroup').val(category.toLowerCase());
}

// Gérer l'ajout d'un contact
function handleAddContact(event) {
    event.preventDefault();
    
    const contact = navigator.contacts.create();
    const fullName = $('#addName').val();
    
    // Configuration du nom
    const name = new ContactName();
    const nameParts = fullName.split(' ');
    name.givenName = nameParts[0] || '';
    name.familyName = nameParts.slice(1).join(' ') || '';
    name.formatted = fullName;
    contact.name = name;
    contact.displayName = fullName;

    // Configuration des champs
    const phoneNumber = $('#addPhone').val();
    const email = $('#addEmail').val();
    const address = $('#addAddress').val();
    const group = $('#addGroup').val();

    // Ajout du numéro de téléphone
    if (phoneNumber) {
        contact.phoneNumbers = [{
            type: 'mobile',
            value: phoneNumber,
            pref: true
        }];
    }

    // Ajout de l'email
    if (email) {
        contact.emails = [{
            type: 'home',
            value: email,
            pref: true
        }];
    }

    // Ajout de l'adresse
    if (address) {
        contact.addresses = [{
            type: 'home',
            formatted: address,
            pref: true
        }];
    }

    // Ajout du groupe
    if (group) {
        contact.categories = [group];
    }

    contact.save(onSaveSuccess, onSaveError);
}

// Gérer la modification d'un contact
function handleEditContact(event) {
    event.preventDefault();
    
    if (!currentContact) {
        alert('Aucun contact sélectionné');
        return;
    }

    const fullName = $('#editName').val();
    const phone = $('#editPhone').val();
    const email = $('#editEmail').val();
    const address = $('#editAddress').val();
    const group = $('#editGroup').val();

    // Mise à jour du nom
    const name = new ContactName();
    const nameParts = fullName.split(' ');
    name.givenName = nameParts[0] || '';
    name.familyName = nameParts.slice(1).join(' ') || '';
    name.formatted = fullName;
    
    // Mettre à jour le contact
    currentContact.name = name;
    currentContact.displayName = fullName;
    currentContact.phoneNumbers = phone ? [{type: 'mobile', value: phone, pref: true}] : [];
    currentContact.emails = email ? [{type: 'home', value: email, pref: true}] : [];
    currentContact.addresses = address ? [{type: 'home', formatted: address, pref: true}] : [];
    currentContact.categories = [group];

    currentContact.save(
        function() {
            onSaveSuccess();
            loadContacts(); // Recharger la liste après modification
        }, 
        onSaveError
    );
}

// Gérer la suppression d'un contact
function handleDeleteContact() {
    if (!currentContact) {
        alert('Aucun contact sélectionné');
        return;
    }
    
    currentContact.remove(
        function() {
            onDeleteSuccess();
            loadContacts(); // Recharger la liste après suppression
        }, 
        onDeleteError
    );
}

// Gérer le changement de photo
function handleChangePhoto() {
    navigator.camera.getPicture(onPhotoSuccess, onPhotoError, {
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: Camera.PictureSourceType.CAMERA,
        allowEdit: true,
        encodingType: Camera.EncodingType.JPEG,
        targetWidth: 1024,
        targetHeight: 1024,
        mediaType: Camera.MediaType.PICTURE,
        correctOrientation: true,
        saveToPhotoAlbum: false
    });
}

// Callbacks de succès et d'erreur
function onSaveSuccess() {
    alert('Contact sauvegardé avec succès!');
    $.mobile.changePage('#homePage');
}

function onSaveError(error) {
    console.error('Erreur lors de la sauvegarde:', error);
    alert('Impossible de sauvegarder le contact: ' + error);
}

function onDeleteSuccess() {
    alert('Contact supprimé avec succès!');
    $.mobile.changePage('#homePage');
}

function onDeleteError(error) {
    console.error('Erreur lors de la suppression:', error);
    alert('Impossible de supprimer le contact: ' + error);
}

function onPhotoSuccess(imageURI) {
    if (currentContact) {
        currentContact.photos = [{
            type: 'url',
            value: imageURI
        }];
        currentContact.save(() => {
            $('img[alt="Contact Photo"]').attr('src', imageURI);
        }, onPhotoError);
    } else {
        $('img[alt="Photo"]').attr('src', imageURI);
    }
}

function onPhotoError(message) {
    console.error('Erreur lors de la capture photo:', message);
    alert('Impossible de capturer la photo: ' + message);
}
