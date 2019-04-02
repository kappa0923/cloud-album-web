/**
 * Copyright (c) 2018 kappa0923.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:

 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
'use strict';

// Import modules
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const { Storage } = require('@google-cloud/storage');
const gcs = new Storage();
const vision = require('@google-cloud/vision');
const path = require('path');
const os = require('os');
const fs = require('fs');

/**
 * Generate a label automatically using Cloud Vision API
 * when an image uploaded in the Storage.
 */
exports.detectLabels = functions.storage.object().onFinalize((object) => {
  // Get file object
  const fileBucket = object.bucket;
  const filePath = object.name;
  const fileName = path.basename(filePath);
  const contentType = object.contentType;
  const resourceState = object.resourceState;
  const localTmpFile = path.join(os.tmpdir(), fileName);
  const firestore = admin.firestore();
  const client = new vision.ImageAnnotatorClient();

  // 画像ファイルでなければ終了
  if (!contentType.startsWith('image/')) {
    console.info('This is not an image.');
    return 0;
  }

  // 削除済みの場合は処理せず終了
  if (resourceState === 'not_exists') {
    console.info('This is a deletion event.');
    return 0;
  }

  const bucket = gcs.bucket(fileBucket);

  return bucket.file(filePath).download({
    destination: localTmpFile,
  }).then(() => {
    console.info('Image downloaded locally to', localTmpFile);

    return client.labelDetection(localTmpFile);
  }).then((res) => {
    console.info('Label Detection ', JSON.stringify(res));

    // 画像のラベルを取得
    const labels = res[0].labelAnnotations.map((label) => label.description) || ['unknown'];

    // 画像の情報をアップデート
    return firestore.collection('images').where('fileName', '==', fileName)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          data.imageLabel = labels[0];
          firestore.collection('images').doc(doc.id).set(data);
        });
      });
  }).then(() => {
    // ローカルの後処理
    fs.unlinkSync(localTmpFile);
    console.info('Delete local tmp files',
      { localTmpFile: localTmpFile });
    return;
  })
    .then(() => console.info('Generate Thumbnail Success'))
    .catch((err) => console.error(err));
});
