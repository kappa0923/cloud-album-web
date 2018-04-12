// index.js
'use strict';

// Initializes CloudAlbum.
class CloudAlbum {
  // Template for picture.
  static get PICTURE_TEMPLATE() {
    return (
      '<li class="mdc-image-list__item">' +
      '<div class="mdc-image-list__image-aspect-container">' +
      '<img class="mdc-image-list__image pic">' +
      '</div>' +
      '</li>'
    );
  }

  constructor() {
    this.checkSetup();

    this.uploadButton = document.getElementById('album-add');
    this.uploadInput = document.getElementById('album-upload');

    this.uploadButton.addEventListener('click', this.uploadClicked.bind(this));
    this.uploadInput.addEventListener('change', this.uploadImage.bind(this));
  }

  /**
   * @desc Display a Picture in the UI
   * @param {string} key 一意のキー
   * @param {string} picUrl 表示画像のURL
   */
  displayPicture(key, picUrl) {
    var item = document.getElementById(key);

    if (!item) {
      var container = document.createElement('li');
      container.innerHTML = CloudAlbum.PICTURE_TEMPLATE;
      item = container.firstChild;
      item.setAttribute('id', key);
      this.pictureList.appendChild(item);
    }
    if (picUrl) {
      item.querySelector('.pic').setAttribute('src', picUrl);
    }

    // Show the card fading-in.
    setTimeout(() => {
      item.classList.add('visible')
    }, 1);
    this.pictureList.scrollTop = this.pictureList.scrollHeight;
  }

  /**
   * @desc アップロードボタンが押されたことを検知する
   * @param {object} event イベントオブジェクト
   */
  uploadClicked(event) {
    event.preventDefault();
    this.uploadInput.click();
  }

  /**
   * @desc ファイル選択後に呼ばれる
   * @param {object} event イベントオブジェクト
   */
  uploadImage(event) {
    console.log(event);
  }

  /**
   * @desc firebaseが正常にロードされているかのチェック
   */
  checkSetup() {
    if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
      window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
    }
  }
}

window.onload = () => {
  // Initializes CloudAlbum.
  window.cloudAlbum = new CloudAlbum();
  window.mdc.autoInit();
};
