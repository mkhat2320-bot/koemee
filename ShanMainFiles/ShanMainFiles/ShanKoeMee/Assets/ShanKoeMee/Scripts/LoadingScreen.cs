using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class LoadingScreen : MonoBehaviour {
    private int updateCount = 0;
    void Start () {

    }

    void Update () {
        updateCount += 1;
        if (updateCount >= 3) {
            SceneManager.LoadScene ("GameScene");
        }
    }
}