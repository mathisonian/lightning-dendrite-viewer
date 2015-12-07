

## Example Data Folder

The [lightning visualization server](https://github.com/lightning-viz/lightning) uses the files in this folder
to help generate interactive previews of visualizations.



### thumbnail.png

A file in this folder named `thumbnail.png` will automatically be used as a preview image.


### Sample Data (`sample-data.json`)

Used to seed data when previewing live versions of this visualization. It should contain a JSON array of dataset object, each containing a name and a data property. E.g.

```
[{
    "name": "example dataset 1",
    "data": []
}, {
    "name": "example dataset 2",
    "data": []
}]

```


### Sample Images (`sample-images.json`)

If the visualizaton consumes images this is used to seed them when previewing live versions of this visualization. It should contain a JSON array of URLs pointing to an image

```
['http://exampleurl.com/image1.png', 'http://exampleurl.com/image2.png']

```

