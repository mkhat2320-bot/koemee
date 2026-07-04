using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class ShopScreen : MonoBehaviour {

    void Start () {

    }

    // Update is called once per frame
    void Update () {

    }

    public void back () {
        StartingValues.pokerBackStr = "yes";
        SceneManager.LoadScene ("GameScene");
    }
}