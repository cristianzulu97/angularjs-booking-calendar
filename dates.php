<?php

class Dates
{
  private $postDates;

  function __construct($jsonFileUrl)
  {
    $this->jsonFileUrl = $jsonFileUrl;
  }

  function getPostData(){
    $rowPostDates = file_get_contents("php://input");
    if($rowPostDates){
      $this->postDates = json_decode($rowPostDates);
    }
  }

  function returnDates(){
    if($this->postDates){
      $newDates = $this->joinJsons($this->postDates, $this->getJsonFromFile());
      $result = json_encode($newDates);
      $this->updateJsonFile($this->jsonFileUrl, $result);
    }
    else {
      $result = json_encode($this->getJsonFromFile());
    }
    echo $result;
  }

  protected function getJsonFromFile(){
    $this->jsonDates = file_get_contents($this->jsonFileUrl);
    return json_decode($this->jsonDates);
  }

  protected function joinJsons($jsonA, $jsonB){
    $resultJson = unserialize(serialize($jsonA));
    $resultCount = count($resultJson->dates);

    for ($i=0; $i < count($jsonB->dates); $i++) {
      $duplicateFlag = false;
      for ($j=0; $j < count($jsonA->dates); $j++) {
        if ($jsonB->dates[$i]->date == $jsonA->dates[$j]->date) {
          $duplicateFlag = true;
        }
      }
      if (!$duplicateFlag) {
        $resultJson->dates[$resultCount] = $jsonB->dates[$i];
        $resultCount++;
        $duplicateFlag = false;
      }
    }
    return $resultJson;
  }

  protected function updateJsonFile($filename, $newContent){
    file_put_contents($filename, $newContent);
  }
}

$dates = new Dates("json.json");
$dates->getPostData();
$dates->returnDates();
